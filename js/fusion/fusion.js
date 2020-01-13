const Fusion = function(renderer) {
    const from = new Vector(10, 10, 10);
    const to = new Vector();
    const up = new Vector(0, 1, 0);

    this.update = timeStep => {

    };

    this.draw = () => {
        renderer.clear();
        renderer.view(from, to, up);
    };
};