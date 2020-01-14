const Gradient = function() {
    this.createData = steps => {
        const data = new Array(steps << 2);

        const start = new Color(0, 0, 0, 1);
        const end = new Color(1, 0.5, 0.7, 1);

        for (let i = 0; i < steps; ++i) {
            const f = i / steps;
            const color = start.mix(end, f);
            const index = i << 2;

            data[index] = Math.round(color.r * 255);
            data[index + 1] = Math.round(color.g * 255);
            data[index + 2] = Math.round(color.b * 255);
            data[index + 3] = Math.round(color.a * 255);
        }

        return data;
    };
};