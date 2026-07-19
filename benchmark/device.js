const DeviceDetector = {
    getDeviceInfo: async function() {
        const gl = document.createElement('canvas').getContext('webgl');
        let gpu = 'Unknown GPU';
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            }
        }

        const cores = navigator.hardwareConcurrency || 'Unknown';
        const ram = navigator.deviceMemory ? `${navigator.deviceMemory} GB+` : 'Unknown';
        
        let connection = 'Unknown';
        if (navigator.connection) {
            connection = `${navigator.connection.effectiveType} (DL: ${navigator.connection.downlink}Mbps, RTT: ${navigator.connection.rtt}ms)`;
        }

        let storage = 'Unknown';
        if (navigator.storage && navigator.storage.estimate) {
            const est = await navigator.storage.estimate();
            storage = `${(est.quota / (1024*1024*1024)).toFixed(2)} GB`;
        }

        return {
            "OS / Browser": navigator.userAgent.split(' ')[0] + " " + navigator.platform,
            "Logical Cores": cores,
            "RAM Estimate": ram,
            "GPU Renderer": gpu,
            "Resolution": `${window.screen.width}x${window.screen.height} (@${window.devicePixelRatio}x)`,
            "Network": connection,
            "Storage Quota": storage,
            "Language": navigator.language
        };
    },

    render: async function(containerId) {
        const container = document.getElementById(containerId);
        const info = await this.getDeviceInfo();
        container.innerHTML = '';
        for (const [key, value] of Object.entries(info)) {
            container.innerHTML += `<div class="device-info-item"><span>${key}:</span> <strong>${value}</strong></div>`;
        }
    }
};
