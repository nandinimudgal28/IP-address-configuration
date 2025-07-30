// IP Validator
function validateIP() {
  const ip = document.getElementById('ipInput').value;
  const result = document.getElementById('validationResult');
  result.innerText = 'Validating...';

  fetch('/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ip })
  })
    .then(res => res.json())
    .then(data => {
      result.innerText = data.message;
    })
    .catch(err => {
      result.innerText = 'Error validating IP.';
      console.error(err);
    });
}

// Static IP Setup
function setStaticIP() {
  const iface = document.getElementById('interfaceName').value;
  const ip = document.getElementById('staticIP').value;
  const subnet = document.getElementById('subnetMask').value;
  const gateway = document.getElementById('gateway').value;

  console.log("Setting static IP:", { iface, ip, subnet, gateway });

  fetch('/set_static', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ interface: iface, ip, subnet, gateway })
  })
  .then(res => res.json())
  .then(data => {
    document.getElementById('staticResult').textContent = data.message;
  })
  .catch(err => {
    console.error("Error:", err);
    document.getElementById('staticResult').textContent = "Error setting static IP.";
  });
}

// Enable DHCP
function enableDHCP() {
  const iface = document.getElementById('dhcpInterface').value;

  fetch('/enable_dhcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ iface })
  })
    .then(res => res.json())
    .then(data => {
      document.getElementById('dhcpResult').innerText = data.message;
    })
    .catch(err => {
      document.getElementById('dhcpResult').innerText = 'Failed to enable DHCP.';
      console.error(err);
    });
}

// SSH Connect
function connectSSH() {
  const data = {
    ip: document.getElementById('sshIP').value,
    user: document.getElementById('sshUser').value,
    pass: document.getElementById('sshPass').value
  };

  fetch('/ssh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
    .then(res => res.json())
    .then(data => {
      document.getElementById('sshResult').innerText = data.message;
    })
    .catch(err => {
      document.getElementById('sshResult').innerText = 'SSH connection failed.';
      console.error(err);
    });
}

// SCP Transfer
function transferFile() {
  const data = {
    from: document.getElementById('scpFrom').value,
    to: document.getElementById('scpTo').value
  };

  fetch('/scp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
    .then(res => res.json())
    .then(data => {
      document.getElementById('scpResult').innerText = data.message;
    })
    .catch(err => {
      document.getElementById('scpResult').innerText = 'SCP transfer failed.';
      console.error(err);
    });
}

// Real-time Network Info
function fetchNetworkInfo() {
  fetch('/network_info')
    .then(res => res.json())
    .then(data => {
      document.getElementById('networkOutput').textContent = JSON.stringify(data, null, 2);
    })
    .catch(err => {
      document.getElementById('networkOutput').textContent = 'Failed to fetch network info.';
      console.error(err);
    });
}

document.getElementById('showInfoBtn').addEventListener('click', () => {
  fetch('/network_info')
    .then(response => response.json())
    .then(data => {
      const output = document.getElementById('networkInfoOutput');
      if (data.status === "success") {
        let html = '<pre>';
        for (let iface in data.interfaces) {
          html += `${iface}:\n`;
          const details = data.interfaces[iface];
          for (let key in details) {
            html += `  ${key}: ${details[key]}\n`;
          }
        }
        html += '</pre>';
        output.innerHTML = html;
      } else {
        output.textContent = data.message || 'Failed to fetch network info.';
      }
    })
    .catch(err => {
      document.getElementById('networkInfoOutput').textContent = 'Network info fetch error.';
      console.error(err);
    });
});

// System Info Toggle
function togglePanel() {
  const panel = document.getElementById("systemPanel");
  panel.style.display = panel.style.display === "none" ? "block" : "none";

  fetch("/system_info")
    .then(res => res.json())
    .then(data => {
      document.getElementById("sysinfo-box").textContent = data.info || JSON.stringify(data, null, 2);
    })
    .catch(err => {
      document.getElementById("sysinfo-box").textContent = 'Failed to fetch system info.';
      console.error(err);
    });
}

// Auto-fetch system info on load
window.addEventListener('DOMContentLoaded', () => {
  fetch("/system_info")
    .then(res => res.json())
    .then(data => {
      const el = document.getElementById("sysinfo-box");
      if (el) el.textContent = data.info || JSON.stringify(data, null, 2);
    });
});

// Global chart reference
let chart;

// 🟢 Ping + RTT chart
function pingIP() {
  const ip = document.getElementById("diagIP").value;

  fetch("/ping", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ip: ip })
  })
    .then(res => res.json())
    .then(data => {
      document.getElementById("diagResult").textContent = data.output;

      const rtts = data.rtts;
      if (rtts && rtts.length > 0) {
        drawChart(rtts);
      }
    })
    .catch(err => {
      console.error(err);
      document.getElementById("diagResult").textContent = "Ping failed.";
    });
}

function drawChart(dataPoints) {
  const ctx = document.getElementById("pingChart").getContext("2d");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dataPoints.map((_, i) => `Ping ${i + 1}`),
      datasets: [{
        label: 'Ping RTT (ms)',
        data: dataPoints,
        borderColor: '#007bff',
        backgroundColor: 'rgba(0, 123, 255, 0.2)',
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

// 🟡 Traceroute + Hop Latency Chart
function tracerouteIP() {
  const ip = document.getElementById("diagIP").value;
  const loadingMsg = document.getElementById("loadingTraceroute");
  const resultBox = document.getElementById("diagResult");

  loadingMsg.style.display = "block";
  resultBox.textContent = "";

  fetch("/traceroute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ip: ip })
  })
    .then(res => res.json())
    .then(data => {
      loadingMsg.style.display = "none";

      if (data.status === "success") {
        resultBox.textContent = data.output;
        renderHopChart(data.hops);
        alert("Traceroute done in " + data.execution_time + "s");
      } else {
        resultBox.textContent = "Error: " + (data.message || "Traceroute failed");
      }
    })
    .catch(err => {
      loadingMsg.style.display = "none";
      console.error("Traceroute error:", err);
      resultBox.textContent = "Traceroute request failed.";
    });
}

function renderHopChart(hops) {
  const ctx = document.getElementById('hopChart').getContext('2d');
  if (window.hopChartInstance) window.hopChartInstance.destroy();

  window.hopChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: hops.map((_, i) => `Hop ${i + 1}`),
      datasets: [{
        label: 'Latency (ms)',
        data: hops,
        backgroundColor: 'rgba(0, 255, 195, 0.2)',
        borderColor: '#00ffc3',
        borderWidth: 2,
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, title: { display: true, text: 'Time (ms)' } },
        x: { title: { display: true, text: 'Hop Number' } }
      }
    }
  });
}
