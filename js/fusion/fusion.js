const Fusion = function(renderer, lightElement) {
    const dist = 25;
    const from = new Vector();
    const to = new Vector(0, 0, 0);
    const up = new Vector(0, 1, 0);

    const attractors = new Array(Fusion.ATTRACTORS);
    const trails = new Array(Fusion.TRAILS);
    const lines = new renderer.MeshLines(trails);

    let light = 0;
    let progress = 0;
    let a = 0.5 * Math.PI;

    for (let i = 0; i < trails.length; ++i) {
        const r = Math.PI * 2 * i / trails.length;
        const d = 120;
        trails[i] = new Trail(
            new Vector(
                Math.cos(r) * d,
                Math.sin(r) * d,
                0));
    }

    const makeAttractors = () => {
        for (let i = 0; i < attractors.length; ++i)
            attractors[i] = new Attractor(
                new Vector(
                    -Fusion.ATTRACTOR_SPAWN_RADIUS + Fusion.ATTRACTOR_SPAWN_RADIUS * 2 * Math.random(),
                    -Fusion.ATTRACTOR_SPAWN_RADIUS + Fusion.ATTRACTOR_SPAWN_RADIUS * 2 * Math.random(),
                    -Fusion.ATTRACTOR_SPAWN_RADIUS + Fusion.ATTRACTOR_SPAWN_RADIUS * 2 * Math.random()),
                Fusion.ATTRACTOR_RADIUS_MIN + (Fusion.ATTRACTOR_RADIUS_MAX - Fusion.ATTRACTOR_RADIUS_MIN) * Math.random());
    };

    const traceTrails = () => {
        for (const trail of trails)
            trail.trace(attractors);

        lines.upload();
    };

    const prepare = () => {
        makeAttractors();
        traceTrails();
    };

    this.update = timeStep => {
        if ((a += timeStep * 0.1) > Math.PI * 2)
            a -= Math.PI * 2;

        progress += timeStep * 0.25;

        if (light === 0) {
            if (progress > Fusion.FLASH_START) {
                lightElement.classList.add("active");
                light = 1;
            }
        }
        else if (light === 1) {
            if (progress > Fusion.FLASH_END) {
                lightElement.classList.remove("active");
                light = 2;
            }
        }

        if (progress > 1) {
            progress = 0;
            light = 0;

            prepare();
        }
    };

    this.draw = () => {
        from.x = 0;
        from.z = dist;

        renderer.clear();
        renderer.view(from, to, up, a);
        lines.draw(
            progress,
            Math.pow(0.5 - 0.5 * Math.cos(progress * (Math.PI + Math.PI)), Fusion.ALPHA_POWER),
            Fusion.FLASH_START);
    };

    prepare();
};

Fusion.FLASH_START = 0.14;
Fusion.FLASH_END = 0.16;
Fusion.ALPHA_POWER = 2;
Fusion.TRAILS = 1024;
Fusion.ATTRACTORS = 5;
Fusion.ATTRACTOR_RADIUS_MIN = 2;
Fusion.ATTRACTOR_RADIUS_MAX = 9;
Fusion.ATTRACTOR_SPAWN_RADIUS = 70;