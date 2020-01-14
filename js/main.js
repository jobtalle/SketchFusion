const TIME_STEP_MAX = 0.1;

const wrapper = document.getElementById("wrapper");
const canvas = document.getElementById("renderer");
const light = document.getElementById("light");
const renderer = new Renderer(canvas, new Color(0, 0, 0, 1));
const fusion = new Fusion(renderer, light);
let lastDate = new Date();

const resize = () => {
    canvas.width = wrapper.offsetWidth;
    canvas.height = wrapper.offsetHeight;

    renderer.resize(canvas.width, canvas.height);
};

const update = timeStep => {
    fusion.update(Math.min(timeStep, TIME_STEP_MAX));
    fusion.draw();
};

const loopFunction = () => {
    const date = new Date();

    update((date - lastDate) * 0.001);
    requestAnimationFrame(loopFunction);

    lastDate = date;
};

window.onresize = resize;

resize();
requestAnimationFrame(loopFunction);