const Renderer = function(canvas, clearColor, gradients) {
    const gl = canvas.getContext("webgl", {"antialias": false}) || canvas.getContext("experimental-webgl", {"antialias": false});
    const matrixBuffer = new Array(16);
    const matrixProjection = new Matrix();
    const matrixView = new Matrix();
    const matrixAll = new Matrix();
    const quad = gl.createBuffer();
    const framebuffer = gl.createFramebuffer();
    const fboTexture = gl.createTexture();
    const gradient = gl.createTexture();
    let width = canvas.width;
    let height = canvas.height;
    let targetWidth = Math.round(width * Renderer.TARGET_SCALE);
    let targetHeight = Math.round(height * Renderer.TARGET_SCALE);
    let gradientIndex = 0;

    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0, 0,
        1, 0,
        0, 1,
        1, 1
    ]), gl.STATIC_DRAW);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, gradient);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fboTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fboTexture, 0);

    const updateGradient = () => {
        gl.bindTexture(gl.TEXTURE_2D, gradient);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, Renderer.GRADIENT_PRECISION, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(gradients[gradientIndex].createData(Renderer.GRADIENT_PRECISION)));
        gl.bindTexture(gl.TEXTURE_2D, fboTexture);
    };

    const updateFBO = () => {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, targetWidth, targetHeight, 0, gl.RGBA, gl.FLOAT, new Float32Array(targetWidth * targetHeight << 2));
    };

    const Shader = function(vertex, fragment, uniforms, attributes) {
        const shaderVertex = gl.createShader(gl.VERTEX_SHADER);
        const shaderFragment = gl.createShader(gl.FRAGMENT_SHADER);
        const program = gl.createProgram();

        gl.shaderSource(shaderVertex, vertex);
        gl.compileShader(shaderVertex);

        gl.shaderSource(shaderFragment, fragment);
        gl.compileShader(shaderFragment);

        gl.attachShader(program, shaderVertex);
        gl.attachShader(program, shaderFragment);
        gl.linkProgram(program);
        gl.detachShader(program, shaderVertex);
        gl.detachShader(program, shaderFragment);
        gl.deleteShader(shaderVertex);
        gl.deleteShader(shaderFragment);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS))
            console.log(gl.getProgramInfoLog(program));

        this.use = () => {
            gl.useProgram(program);

            return this;
        };

        for (const uniform of uniforms)
            this["u" + uniform.charAt(0).toUpperCase() + uniform.slice(1)] = gl.getUniformLocation(program, uniform);

        for (const attrib of attributes)
            this["a" + attrib.charAt(0).toUpperCase() + attrib.slice(1)] = gl.getAttribLocation(program, attrib);
    };

    const programLines = new Shader(
        Renderer.SHADER_LINES_VERTEX,
        Renderer.SHADER_LINES_FRAGMENT,
        ["transform", "t", "alpha", "flashStart"],
        ["position"]);
    const programFilter = new Shader(
        Renderer.SHADER_FILTERED_VERTEX,
        Renderer.SHADER_FILTERED_FRAGMENT,
        ["texture", "gradient", "resolution"],
        ["vertex"]);
    const programGradient = new Shader(
        Renderer.SHADER_GRADIENT_VERTEX,
        Renderer.SHADER_GRADIENT_FRAGMENT,
        ["alpha", "power", "aspect"],
        ["vertex"]);
    let programCurrent = null;

    const updateMatrices = () => {
        matrixAll.set(matrixProjection);
        matrixAll.multiply(matrixView);
        matrixAll.toArray(matrixBuffer);
    };

    const sendMatrices = () => {
        if (!programCurrent)
            return;

        gl.uniformMatrix4fv(programCurrent.uTransform, false, matrixBuffer);
    };

    const setProgram = program => {
        if (programCurrent !== program) {
            programCurrent = program.use();

            sendMatrices();
        }
    };

    this.MeshLines = function(trails) {
        const buffer = gl.createBuffer();
        const elements = trails.length * (Trail.STEPS - 1);
        const data = new Array(elements * 8);
        const factors = new Array(Trail.STEPS);

        for (let i = 0; i < factors.length; ++i)
            factors[i] = i / factors.length;

        this.upload = () => {
            for (let i = 1; i < Trail.STEPS; ++i) for (let trail = 0; trail < trails.length; ++trail) {
                const ip = i - 1;
                const index = (ip * trails.length + trail) << 3;

                data[index] = trails[trail].points[ip].x;
                data[index + 1] = trails[trail].points[ip].y;
                data[index + 2] = trails[trail].points[ip].z;
                data[index + 3] = factors[ip];
                data[index + 4] = trails[trail].points[i].x;
                data[index + 5] = trails[trail].points[i].y;
                data[index + 6] = trails[trail].points[i].z;
                data[index + 7] = factors[i];
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        };

        this.draw = (progress, alpha, flashStart) => {
            setProgram(programLines);

            const last = Math.ceil(Trail.STEPS * progress) * trails.length;
            const first = Math.max(0, last - trails.length * Math.floor(Trail.STEPS * 0.334));

            gl.uniform1f(programLines.uT, progress);
            gl.uniform1f(programLines.uAlpha, alpha);
            gl.uniform1f(programLines.uFlashStart, flashStart);

            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.enableVertexAttribArray(programLines.aPosition);
            gl.vertexAttribPointer(programLines.aPosition, 4, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.LINES, first << 1, (last - first) << 1);
        };

        this.free = () => {
            gl.deleteBuffer(buffer);
        };
    };

    this.randomizeGradient = () => {
        if (gradients.length === 1)
            return;

        const previous = gradientIndex;

        while (gradientIndex === previous)
            gradientIndex = Math.floor(Math.pow(Math.random(), 2.5) * gradients.length);

        updateGradient();
    };

    this.toBuffer = () => {
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.viewport(0, 0, targetWidth, targetHeight);
        gl.clear(gl.COLOR_BUFFER_BIT);
    };

    this.toMain = () => {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, width, height);
    };

    this.renderBuffer = t => {
        setProgram(programFilter);

        gl.uniform1i(programFilter.uTexture, 0);
        gl.uniform1i(programFilter.uGradient, 1);
        gl.uniform2f(programFilter.uResolution, 1 / width, 1 / height);
        gl.bindBuffer(gl.ARRAY_BUFFER, quad);
        gl.enableVertexAttribArray(programFilter.aVertex);
        gl.vertexAttribPointer(programFilter.aVertex, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    this.renderGradient = (alpha, power) => {
        setProgram(programGradient);

        gl.uniform1f(programGradient.uAlpha, alpha);
        gl.uniform1f(programGradient.uPower, power);
        gl.uniform1f(programGradient.uAspect, width / height);
        gl.bindBuffer(gl.ARRAY_BUFFER, quad);
        gl.enableVertexAttribArray(programGradient.aVertex);
        gl.vertexAttribPointer(programGradient.aVertex, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    this.resize = (w, h) => {
        width = w;
        height = h;
        targetWidth = Math.round(width * Renderer.TARGET_SCALE);
        targetHeight = Math.round(height * Renderer.TARGET_SCALE);
        matrixProjection.perspective(Renderer.ANGLE, w / h, Renderer.Z_NEAR, Renderer.Z_FAR);

        updateFBO();
        updateGradient();
        updateMatrices();
    };

    this.view = (from, to, up) => {
        matrixView.lookAt(from, to, up);

        updateMatrices();
    };

    this.clear = () => {
        programCurrent = null;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    };

    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(clearColor.r, clearColor.g, clearColor.b, clearColor.a);
    gl.getExtension("OES_texture_float");

    updateFBO();
    updateGradient();
};

Renderer.Z_NEAR = 0.1;
Renderer.Z_FAR = 500;
Renderer.ANGLE = Math.PI * 0.5;
Renderer.TARGET_SCALE = 1;
Renderer.GRADIENT_PRECISION = 80;
Renderer.SHADER_VERSION = "#version 100\n";
Renderer.SHADER_LINES_VERTEX = Renderer.SHADER_VERSION +
    "uniform mat4 transform;" +
    "uniform mediump float t;" +
    "attribute vec4 position;" +
    "varying mediump float f;" +
    "void main() {" +
        "f = position.w;" +
        "gl_Position = transform * vec4(position.xyz * length(position.xyz) * 0.008 * pow(t, 0.3), 1.0);" +
    "}";
Renderer.SHADER_LINES_FRAGMENT = Renderer.SHADER_VERSION +
    "uniform mediump float t;" +
    "uniform mediump float alpha;" +
    "uniform mediump float flashStart;" +
    "varying mediump float f;" +
    "void main() {" +
        "mediump float transparency;" +

        "if (f < t) {" +
            "if (t < flashStart)" +
                "transparency = 0.5 * alpha * (f / flashStart);" +
            "else " +
                "transparency = alpha * (pow(1.0 - pow((t - f), 0.6), 11.0));" +
        "}" +
        "else " +
            "discard;" +
        "gl_FragColor = vec4(1.0, 0.0, 0.0, transparency);" +
    "}";
Renderer.SHADER_FILTERED_VERTEX = Renderer.SHADER_VERSION +
    "attribute vec2 vertex;" +
    "varying mediump vec2 uv;" +
    "void main() {" +
        "uv = vertex;" +
        "gl_Position = vec4(vec2(-1.0) + 2.0 * vertex, 0.0, 1.0);" +
    "}";
Renderer.SHADER_FILTERED_FRAGMENT = Renderer.SHADER_VERSION +
    "uniform mediump vec2 resolution;" +
    "uniform sampler2D texture;" +
    "uniform sampler2D gradient;" +
    "varying mediump vec2 uv;" +
    "void main() {" +
        "mediump float p =" +
            "texture2D(texture, uv + vec2(1.0, 0.0) * resolution).r +" +
            "texture2D(texture, uv + vec2(0.0, 1.0) * resolution).r +" +
            "texture2D(texture, uv + vec2(-1.0, 0.0) * resolution).r +" +
            "texture2D(texture, uv + vec2(1.0, -1.0) * resolution).r;" +
        "gl_FragColor = texture2D(gradient, vec2(texture2D(texture, uv).r * 0.5 + 0.125 * p, 0));" +
    "}";
Renderer.SHADER_GRADIENT_VERTEX = Renderer.SHADER_VERSION +
    "attribute vec2 vertex;" +
    "varying mediump vec2 position;" +
    "void main() {" +
        "position = vertex;" +
        "gl_Position = vec4(vec2(-1.0) + 2.0 * vertex, 0.0, 1.0);" +
    "}";
Renderer.SHADER_GRADIENT_FRAGMENT = Renderer.SHADER_VERSION +
    "uniform mediump float alpha;" +
    "uniform mediump float power;" +
    "uniform mediump float aspect;" +
    "varying mediump vec2 position;" +
    "void main() {" +
        "mediump float distance = min(1.0, length((vec2(0.5) - vec2(position.x, position.y)) * vec2(2.0 * aspect, 2.0)));" +
        "gl_FragColor = vec4(pow(1.0 - distance, power), 0.0, 0.0, alpha);" +
    "}";