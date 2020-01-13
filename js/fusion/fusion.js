const Fusion = function(renderer, lightElement) {
    const dist = 60;
    const from = new Vector();
    const to = new Vector(0, 0, 0);
    const up = new Vector(0, 1, 0);

    const lines = new renderer.MeshLines();
    const attractors = new Array(Fusion.ATTRACTORS);
    const trails = new Array(Fusion.TRAILS);

    let light = false;
    let progress = 0;
    let a = 0.5 * Math.PI;

    for (let i = 0; i < attractors.length; ++i)
        attractors[i] = new Attractor(
            new Vector(
                -Fusion.ATTRACTOR_SPAWN_RADIUS + Fusion.ATTRACTOR_SPAWN_RADIUS * 2 * Math.random(),
                -Fusion.ATTRACTOR_SPAWN_RADIUS + Fusion.ATTRACTOR_SPAWN_RADIUS * 2 * Math.random(),
                -Fusion.ATTRACTOR_SPAWN_RADIUS + Fusion.ATTRACTOR_SPAWN_RADIUS * 2 * Math.random()),
            Fusion.ATTRACTOR_RADIUS_MIN + (Fusion.ATTRACTOR_RADIUS_MAX - Fusion.ATTRACTOR_RADIUS_MIN) * Math.random());

    for (let i = 0; i < trails.length; ++i) {
        const r = Math.PI * 2 * i / trails.length;

        trails[i] = new Trail(
            new Vector(
                Math.cos(r) * 100,
                Math.sin(r) * 100,
                0));
    }

    for (const trail of trails) {
        trail.trace(attractors);

        for (let i = 1; i < Trail.STEPS; ++i)
            lines.add(
                trail.points[i - 1],
                (i - 1) / Trail.STEPS,
                trail.points[i],
                i / Trail.STEPS);
    }

    this.update = timeStep => {
        // a += timeStep * 0.2;
        progress += timeStep * 0.2;

        if (progress > 0.15 && light === false) {
            light = true;

            lightElement.classList.toggle("active");
        }

        if (progress > 0.17 && light === true) {
            light = false;

            lightElement.classList.toggle("active");
        }

        if (progress > 1)
            progress = 0;
    };

    this.draw = () => {
        from.x = Math.cos(a) * dist;
        from.z = Math.sin(a) * dist;

        renderer.clear();
        renderer.view(from, to, up);
        lines.draw(
            progress,
            Math.pow(0.5 - 0.5 * Math.cos(progress * (Math.PI + Math.PI)), Fusion.ALPHA_POWER));
    };
};

Fusion.ALPHA_POWER = 2;
Fusion.TRAILS = 1000;
Fusion.ATTRACTORS = 5;
Fusion.ATTRACTOR_RADIUS_MIN = 2;
Fusion.ATTRACTOR_RADIUS_MAX = 6;
Fusion.ATTRACTOR_SPAWN_RADIUS = 60;