const Gradient = function() {
    const stops = arguments;

    this.createData = steps => {
        const data = new Array(steps << 2);

        for (let i = 0; i < steps; ++i) {
            const f = i / steps;
            const index = i << 2;

            let lastIndex = 0;

            while (stops[lastIndex << 1] <= Math.min(0.9999, f))
                ++lastIndex;

            const firstIndex = lastIndex - 1;
            const factor = (f - stops[firstIndex << 1]) / (stops[lastIndex << 1] - stops[firstIndex << 1]);
            const color = stops[(firstIndex << 1) + 1].mix(stops[(lastIndex << 1) + 1], factor);

            data[index] = Math.round(color.r * 255);
            data[index + 1] = Math.round(color.g * 255);
            data[index + 2] = Math.round(color.b * 255);
            data[index + 3] = Math.round(color.a * 255);
        }

        return data;
    };
};