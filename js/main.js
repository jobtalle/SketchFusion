const TIME_STEP_MAX = 0.1;

const gradients = [
    new Gradient(
        0, new Color(.06, .06, .06, 1),
        0.1, new Color(.2, .2, .27, 1),
        0.4, new Color(1, 1, 0.6, 1),
        0.7, new Color(1, 1, 1, 1),
        1, new Color(0.7, 0.7, 0.7, 1)),
    new Gradient(
        0, new Color(.06, .06, .06, 1),
        0.1, new Color(.9, .3, .27, 1),
        0.4, new Color(1, 1, 0.6, 1),
        0.7, new Color(1, 1, .04, 1),
        1, new Color(0.7, 0.9, 0.2, 1)),
    new Gradient(
        0, new Color(1 / 256, 1 / 256, 1 / 256, 1),
        0.2, new Color(14 / 256, 13 / 256, 68 / 256, 1),
        0.4, new Color(40 / 256, 16 / 256, 142 / 256, 1),
        0.55, new Color(18 / 256, 102 / 256, 224 / 256, 1),
        0.87, new Color(99 / 256, 242 / 256, 255 / 256, 1),
        1, new Color(255 / 256, 255 / 256, 255 / 256, 1)),
    new Gradient(
        0, new Color(1 / 256, 16 / 256, 24 / 256, 1),
        0.18, new Color(71 / 256, 29 / 256, 49 / 256, 1),
        0.38, new Color(90 / 256, 50 / 256, 35 / 256, 1),
        0.6, new Color(167 / 256, 84 / 256, 52 / 256, 1),
        0.83, new Color(221 / 256, 165 / 256, 55 / 256, 1),
        1, new Color(255 / 256, 152 / 256, 0 / 256, 1)),
    new Gradient(
        0, new Color(9 / 256, 2 / 256, 5 / 256, 1),
        0.2, new Color(76 / 256, 20 / 256, 84 / 256, 1),
        0.25, new Color(108 / 256, 36 / 256, 90 / 256, 1),
        0.6, new Color(204 / 256, 47 / 256, 36 / 256, 1),
        0.8, new Color(224 / 256, 86 / 256, 80 / 256, 1),
        1, new Color(255 / 256, 223 / 256, 153 / 256, 1)),
    new Gradient(
        0, new Color(1 / 256, 1 / 256, 7 / 256, 1),
        0.3, new Color(75 / 256, 11 / 256, 15 / 256, 1),
        0.6, new Color(175 / 256, 92 / 256, 55 / 256, 1),
        0.76, new Color(218 / 256, 137 / 256, 58 / 256, 1),
        0.83, new Color(245 / 256, 229 / 256, 199 / 256, 1),
        1, new Color(233 / 256, 240 / 256, 176 / 256, 1)),
    new Gradient(
        0, new Color(4 / 256, 4 / 256, 4 / 256, 1),
        0.1, new Color(59 / 256, 22 / 256, 4 / 256, 1),
        0.35, new Color(186 / 256, 100 / 256, 26 / 256, 1),
        0.5, new Color(236 / 256, 145 / 256, 37 / 256, 1),
        0.6, new Color(239 / 256, 171 / 256, 38 / 256, 1),
        1, new Color(197 / 256, 200 / 256, 21 / 256, 1)),
    new Gradient(
        0, new Color(18 / 256, 18 / 256, 18 / 256, 1),
        0.12, new Color(83 / 256, 41 / 256, 45 / 256, 1),
        0.4, new Color(209 / 256, 50 / 256, 61 / 256, 1),
        0.63, new Color(193 / 256, 145 / 256, 195 / 256, 1),
        0.87, new Color(0 / 256, 232 / 256, 231 / 256, 1),
        1, new Color(254 / 256, 254 / 256, 254 / 256, 1))
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