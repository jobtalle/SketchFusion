const Fusion = function(renderer, lightElement, width, height) {
    const from = new Vector(0, 0, Fusion.ZOOM);
    const to = new Vector(0, 0, 0);
    const up = new Vector(0, 1, 0);

    const attractors = new Array(Fusion.ATTRACTORS);
    const trails = new Array(Math.ceil(Fusion.TRAILS_PER_PIXEL * width * height));
    const meshes = new Array(Fusion.MESH_COUNT);

    let flash = 0;
    let light = 0;
    let progress = 0;
    let meshIndex = 0;
    let canPrepare = false;

    attractors[0] = new Attractor(
        new Vector(),
        Fusion.ATTRACTOR_RADIUS_CORE);

    for (let i = 0; i < meshes.length; ++i)
        meshes[i] = new renderer.MeshLines(trails);

    for (let i = 0; i < trails.length; ++i) {
        const r = Math.PI * 2 * i / trails.length;

        trails[i] = new Trail(
            new Vector(
                Math.cos(r) * Fusion.TRAILS_RADIUS,
                Math.sin(r) * Fusion.TRAILS_RADIUS,
                Fusion.TRAIL_Z));
    }

    const makeAttractors = () => {
        for (let i = 1; i < attractors.length; ++i)
            attractors[i] = new Attractor(
                new Vector(
                    -Fusion.ATTRACTOR_SPAWN_RADIUS + Fusion.ATTRACTOR_SPAWN_RADIUS * 2 * Math.random(),
                    -Fusion.ATTRACTOR_SPAWN_RADIUS + Fusion.ATTRACTOR_SPAWN_RADIUS * 2 * Math.random(),
                    -Fusion.ATTRACTOR_SPAWN_RADIUS + Fusion.ATTRACTOR_SPAWN_RADIUS * 2 * Math.random()),
                Fusion.ATTRACTOR_RADIUS_MIN + (Fusion.ATTRACTOR_RADIUS_MAX - Fusion.ATTRACTOR_RADIUS_MIN) *
                    Math.pow(Math.random(), Fusion.ATTRACTOR_SPAWN_RADIUS_POWER));
    };

    const traceTrails = () => {
        for (const trail of trails)
            trail.trace(attractors);

        meshes[(meshIndex + 1) % Fusion.MESH_COUNT].upload();
    };

    const prepare = () => {
        makeAttractors();
        traceTrails();
    };

    const nextMesh = () => {
        if (++meshIndex === Fusion.MESH_COUNT)
            meshIndex = 0;
    };

    const drawMesh = (mesh, progress) => {
        mesh.draw(
            progress,
            Math.pow(0.5 - 0.5 * Math.cos(Math.pow(progress, Fusion.ALPHA_PROGRESS_POWER) * (Math.PI + Math.PI)), Fusion.ALPHA_POWER),
            Fusion.FLASH_START);
    };

    this.update = timeStep => {
        progress += timeStep * Fusion.CYCLE_SPEED;
        flash -= timeStep * Fusion.FLASH_TIME;

        if (canPrepare) {
            prepare();

            canPrepare = false;
        }

        if (light === 0) {
            if (progress > Fusion.FLASH_START) {
                lightElement.classList.add("active");
                light = 1;
                flash = 1;
                canPrepare = true;
            }
        }
        else if (light === 1) {
            lightElement.classList.remove("active");
            light = 2;
        }

        if (progress > Fusion.INTERVAL) {
            progress -= Fusion.INTERVAL;
            light = 0;

            nextMesh();
        }
    };

    this.draw = () => {
        renderer.clear();
        renderer.view(from, to, up);

        renderer.toBuffer();
        renderer.renderGradient(
            Math.pow(flash, Fusion.FLASH_POWER),
            Fusion.FLASH_GRADIENT_POWER);

        let p = progress;

        for (let i = 0; i < Fusion.MESH_COUNT; ++i) {
            let index = meshIndex - i;

            if (index < 0)
                index += Fusion.MESH_COUNT;

            drawMesh(meshes[index], p);

            if ((p += Fusion.INTERVAL) > 1)
                break;
        }

        renderer.toMain();
        renderer.renderBuffer();
    };

    this.free = () => {
        for (const mesh of meshes)
            mesh.free();
    };

    for (let i = 0; i < Fusion.MESH_COUNT; ++i) {
        prepare();
        nextMesh();
    }
};

Fusion.ZOOM = 25;
Fusion.TRAIL_Z = -15;
Fusion.TRAILS_RADIUS = 100;
Fusion.INTERVAL = 0.3;
Fusion.MESH_COUNT = Math.ceil(1 / Fusion.INTERVAL);
Fusion.CYCLE_SPEED = 0.1;
Fusion.FLASH_START = 0.14;
Fusion.FLASH_TIME = Fusion.INTERVAL;
Fusion.FLASH_POWER = 7;
Fusion.FLASH_GRADIENT_POWER = 3;
Fusion.ALPHA_POWER = 1.6;
Fusion.ALPHA_PROGRESS_POWER = 0.7;
Fusion.TRAILS_PER_PIXEL = 0.00038;
Fusion.ATTRACTORS = 5;
Fusion.ATTRACTOR_RADIUS_CORE = 10;
Fusion.ATTRACTOR_RADIUS_MIN = 6;
Fusion.ATTRACTOR_RADIUS_MAX = 17.5;
Fusion.ATTRACTOR_SPAWN_RADIUS = 70;
Fusion.ATTRACTOR_SPAWN_RADIUS_POWER = 2.5;