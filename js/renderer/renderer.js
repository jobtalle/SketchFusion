const Renderer = function(canvas, clearColor) {
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    const matrixBuffer = new Array(16);
    const matrixProjection = new Matrix();
    const matrixView = new Matrix();
    const matrixAll = new Matrix();

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

        this.free = () => {
            gl.deleteProgram(program);
        };

        for (const uniform of uniforms)
            this["u" + uniform.charAt(0).toUpperCase() + uniform.slice(1)] = gl.getUniformLocation(program, uniform);

        for (const attrib of attributes)
            this["a" + attrib.charAt(0).toUpperCase() + attrib.slice(1)] = gl.getAttribLocation(program, attrib);
    };

    const programLines = new Shader(
        Renderer.SHADER_LINES_VERTEX,
        Renderer.SHADER_LINES_FRAGMENT,
        ["transform", "shift"],
        ["position"]);
    const programTubes = new Shader(
        Renderer.SHADER_TUBES_VERTEX,
        Renderer.SHADER_TUBES_FRAGMENT,
        ["transform", "shift"],
        ["center", "normal"]);
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

    this.MeshLines = function() {
        const buffer = gl.createBuffer();
        const data = [];
        let elements = 0;
        let updated = false;

        const update = () => {
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STREAM_DRAW);

            updated = false;
        };

        this.clear = () => {
            elements = 0;
            data.length = 0;
        };

        this.add = (start, end) => {
            data.push(start.x, start.y, start.z, end.x, end.y, end.z);

            ++elements;
            updated = true;
        };

        this.append = end => {
            for (let i = 0; i < 3; ++i)
                data.push(data[data.length - 3]);

            data.push(end.x, end.y, end.z);

            ++elements;
            updated = true;
        };

        this.draw = shift => {
            setProgram(programLines);
            gl.uniform3f(programLines.uShift, shift.x, shift.y, shift.z);

            if (updated)
                update();
            else
                gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

            gl.enableVertexAttribArray(programLines.aPosition);
            gl.vertexAttribPointer(programLines.aPosition, 3, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.LINES, 0, elements << 1);
        };

        this.free = () => {
            gl.deleteBuffer(buffer);
        };
    };

    this.MeshTubes = function() {
        const up = new Vector(0, 1, 0);
        const down = new Vector(0, 1, 0);
        const bufferVertices = gl.createBuffer();
        const bufferIndices = gl.createBuffer();
        const vertices = [];
        const indices = [];
        let vertexCount = 0;
        let updated = false;

        const precision = 9;
        const ring = [];

        for (let i = 0; i < precision; ++i)
            ring.push(new Vector(
                Math.cos((i / precision) * Math.PI * 2),
                Math.sin((i / precision) * Math.PI * 2),
                0));

        const update = () => {
            gl.bindBuffer(gl.ARRAY_BUFFER, bufferVertices);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferIndices);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STREAM_DRAW);

            updated = false;
        };

        this.add = (startPosition, startDirection, endPosition, endDirection) => {
            const startX = startDirection.cross(up).normalize();
            const startY = startX.cross(startDirection).normalize();
            const endX = endDirection.cross(up).normalize();
            const endY = endX.cross(endDirection).normalize();

            for (let i = 0; i < ring.length; ++i) {
                const index = i << 1;
                const indexNext = i + 1 === ring.length ? 0 : index + 2;

                vertices.push(
                    startPosition.x,
                    startPosition.y,
                    startPosition.z,
                    startX.x * ring[i].x + startY.x * ring[i].y,
                    startX.y * ring[i].x + startY.y * ring[i].y,
                    startX.z * ring[i].x + startY.z * ring[i].y,
                    endPosition.x,
                    endPosition.y,
                    endPosition.z,
                    endX.x * ring[i].x + endY.x * ring[i].y,
                    endX.y * ring[i].x + endY.y * ring[i].y,
                    endX.z * ring[i].x + endY.z * ring[i].y,);
                indices.push(
                    vertexCount + index,
                    vertexCount + indexNext,
                    vertexCount + indexNext + 1,
                    vertexCount + indexNext + 1,
                    vertexCount + index + 1,
                    vertexCount + index);
            }

            vertexCount += ring.length + ring.length;

            updated = true;
        };

        this.draw = shift => {
            setProgram(programTubes);
            gl.uniform3f(programTubes.uShift, shift.x, shift.y, shift.z);

            if (updated)
                update();
            else {
                gl.bindBuffer(gl.ARRAY_BUFFER, bufferVertices);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferIndices);
            }

            gl.enableVertexAttribArray(programTubes.aCenter);
            gl.vertexAttribPointer(programTubes.aCenter, 3, gl.FLOAT, false, 24, 0);
            gl.enableVertexAttribArray(programTubes.aNormal);
            gl.vertexAttribPointer(programTubes.aNormal, 3, gl.FLOAT, false, 24, 12);
            gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_INT, 0);
        };

        this.free = () => {
            gl.deleteBuffer(bufferVertices);
            gl.deleteBuffer(bufferIndices);
        };
    };

    let width = canvas.width;
    let height = canvas.height;

    this.resize = (w, h) => {
        width = w;
        height = h;
        matrixProjection.perspective(Math.PI * 0.5, w / h, Renderer.Z_NEAR, Renderer.Z_FAR);

        gl.viewport(0, 0, width, height);

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

    this.free = () => {
        programLines.free();
        programTubes.free();
    };

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.clearColor(clearColor.r, clearColor.g, clearColor.b, clearColor.a);
    gl.getExtension("OES_element_index_uint");
};

Renderer.Z_NEAR = 0.1;
Renderer.Z_FAR = 100;
Renderer.SHADER_VERSION = "#version 100\n";
Renderer.SHADER_LINES_VERTEX = Renderer.SHADER_VERSION +
    "uniform mat4 transform;" +
    "uniform vec3 shift;" +
    "attribute vec3 position;" +
    "void main() {" +
        "gl_Position = transform * vec4(position + shift, 1.0);" +
    "}";
Renderer.SHADER_LINES_FRAGMENT = Renderer.SHADER_VERSION +
    "void main() {" +
        "gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);" +
    "}";
Renderer.SHADER_TUBES_VERTEX = Renderer.SHADER_VERSION +
    "uniform mat4 transform;" +
    "uniform vec3 shift;" +
    "attribute vec3 center;" +
    "attribute vec3 normal;" +
    "varying mediump vec3 v_normal;" +
    "void main() {" +
        "v_normal = normal;" +
        "gl_Position = transform * vec4(center + shift + normal * 0.1, 1.0);" +
    "}";
Renderer.SHADER_TUBES_FRAGMENT = Renderer.SHADER_VERSION +
    "varying mediump vec3 v_normal;" +
    "void main() {" +
        "mediump vec3 light = normalize(vec3(0, 0.5, -1.0));" +
        "mediump float lightness = max(0.3, dot(normalize(v_normal) * 0.8, light));" +
        "gl_FragColor = vec4(vec3(lightness), 1.0);" +
    "}";