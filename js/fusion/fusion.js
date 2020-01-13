const Fusion = function(renderer) {
    const dist = 100;
    const from = new Vector(0, dist, dist);
    const to = new Vector(0, 0, 0);
    const up = new Vector(0, 1, 0);

    const lines = new renderer.MeshLines();
    const attractors = new Array(Fusion.ATTRACTORS);
    const trails = new Array(Fusion.TRAILS);

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
        a += timeStep * 0.2;
        progress += timeStep * 0.3;

        if (progress > 1)
            progress = 0;
    };

    this.draw = () => {
        from.x = Math.cos(a) * dist;
        from.z = Math.sin(a) * dist;

        renderer.clear();
        renderer.view(from, to, up);
        lines.draw(progress);
    };
};

Fusion.TRAILS = 1000;
Fusion.ATTRACTORS = 5;
Fusion.ATTRACTOR_RADIUS_MIN = 1;
Fusion.ATTRACTOR_RADIUS_MAX = 5;
Fusion.ATTRACTOR_SPAWN_RADIUS = 30;