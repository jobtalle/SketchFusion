const Trail = function(origin) {
    this.velocityInitial = origin.copy().negate().multiply(Trail.VELOCITY_INITIAL);
    this.velocity = new Vector();
    this.origin = origin;
    this.points = new Array(Trail.STEPS);

    for (let i = 0; i < this.points.length; ++i)
        this.points[i] = new Vector();
};

Trail.makeGravityInfluences = function() {
    const influences = new Array(Trail.STEPS);

    for (let i = 0; i < influences.length; ++i)
        influences[i] = Math.pow(1 - i / Trail.STEPS, Trail.GRAVITY_POWER) * Trail.GRAVITY_MULTIPLIER;

    return influences;
};

Trail.STEPS = 64;
Trail.VELOCITY_INITIAL = 0.05;
Trail.GRAVITY_MULTIPLIER = 3.3;
Trail.GRAVITY_POWER = 2;
Trail.GRAVITY_INFLUENCES = Trail.makeGravityInfluences();

Trail.prototype.trace = function(attractors) {
    this.velocity.set(this.velocityInitial);
    this.points[0].set(this.origin);

    for (let i = 1; i < Trail.STEPS; ++i) {
        const ip = i - 1;

        for (const attractor of attractors) {
            const dx = attractor.position.x - this.points[ip].x;
            const dy = attractor.position.y - this.points[ip].y;
            const dz = attractor.position.z - this.points[ip].z;
            const iSquaredDistance = Trail.GRAVITY_INFLUENCES[i] * attractor.radius / (dx * dx + dy * dy + dz * dz);

            this.velocity.x += dx * iSquaredDistance;
            this.velocity.y += dy * iSquaredDistance;
            this.velocity.z += dz * iSquaredDistance;
        }

        this.points[i].x = this.points[ip].x + this.velocity.x;
        this.points[i].y = this.points[ip].y + this.velocity.y;
        this.points[i].z = this.points[ip].z + this.velocity.z;
    }
};