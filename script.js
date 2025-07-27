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

// On page load: fetch system info (optional)
window.addEventListener('DOMContentLoaded', () => {
  fetch("/system_info")
    .then(res => res.json())
    .then(data => {
      const el = document.getElementById("sysinfo-box");
      if (el) el.textContent = data.info || JSON.stringify(data, null, 2);
    });
});

// Ping
function pingIP() {
  const ip = document.getElementById('diagIP').value;
  console.log("Sending ping request to:", ip);  // 🔍 DEBUG

  fetch('/ping', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ip })
  })
    .then(res => res.json())
    .then(data => {
      console.log("Ping Response:", data);       // 🔍 DEBUG
      document.getElementById('diagResult').innerText = data.output;
    })
    .catch(err => {
      console.error("Ping Error:", err);         // 🔍 DEBUG
      document.getElementById('diagResult').innerText = 'Ping failed.';
    });
}

// Traceroute
function tracerouteIP() {
  const ip = document.getElementById('diagIP').value;

  fetch('/traceroute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ip })
  })
    .then(res => res.json())
    .then(data => {
      document.getElementById('diagResult').innerText = data.output;
    })
    .catch(err => {
      document.getElementById('diagResult').innerText = 'Traceroute failed.';
      console.error(err);
    });
}
function showNetworkInfo() {
  fetch('/network_info')
    .then(response => response.json())
    .then(data => {
      if (data.status === "success") {
        let display = "";
        for (let iface in data.interfaces) {
          const info = data.interfaces[iface];
          display += `<b>${iface}</b><br>`;
          display += `IP: ${info.IPv4 || '-'}<br>`;
          display += `MAC: ${info.MAC || '-'}<br><br>`;
        }
        document.getElementById("network-output").innerHTML = display;
      } else {
        alert("Error: " + data.message);
      }
    });
}


