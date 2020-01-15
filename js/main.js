const TIME_STEP_MAX = 0.1;

const gradients = [
    new Gradient(
        0, new Color(.06, .06, .06, 1),
        0.1, new Color(.2, .2, .27, 1),
        0.4, new Color(1, 1, 0.6, 1),
        0.7, new Color(1, 1, 1, 1),
        1, new Color(0.7, 0.7, 0.7, 1)),
    new Gradient(
        0, new Color(0, 0, 0, 1),
        0.5, new Color(0, 1, 1, 1),
        1, new Color(1, 1, 1, 1)
    )
];
const wrapper = document.getElementById("wrapper");
const canvas = document.getElementById("renderer");
const light = document.getElementById("light");
const renderer = new Renderer(canvas, new Color(.03, 0, 0, 1), gradients);
let fusion = new Fusion(renderer, light, canvas.width, canvas.height);
let lastDate = new Date();

const resize = () => {
    canvas.width = wrapper.offsetWidth;
    canvas.height = wrapper.offsetHeight;

    renderer.resize(canvas.width, canvas.height);
    fusion.free();
    fusion = new Fusion(renderer, light, canvas.width, canvas.height);
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