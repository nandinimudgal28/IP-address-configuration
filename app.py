from flask import Flask, render_template, request, jsonify, Response
import subprocess
import ipaddress
from datetime import datetime
import os
import platform
from pymongo import MongoClient
import psutil

app = Flask(__name__)

# MongoDB Setup
client = MongoClient("mongodb://localhost:27017/")
db = client["ip_dashboard"]
logs_collection = db["logs"]

# Utility: Log to MongoDB
def log_action(action, ip, details):
    log = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "action": action,
        "ip": ip,
        "details": details
    }
    logs_collection.insert_one(log)
    print("Inserted log:", log)

# Home Page
@app.route('/')
def home():
    logs = list(logs_collection.find().sort("_id", -1).limit(10))
    return render_template('index.html', logs=logs)

# IP Validation
@app.route('/validate', methods=['POST'])
def validate_ip():
    data = request.get_json()
    ip = data.get('ip')

    if not ip:
        return jsonify({'message': 'No IP provided'}), 400

    try:
        ipaddress.ip_address(ip)
        message = f"{ip} is a valid IP address"
    except ValueError:
        message = f"{ip} is NOT a valid IP address"

    log_action("IP Validation", ip, message)
    return jsonify({'message': message})

# Set Static IP (Simulated or Real)
@app.route('/set_static', methods=['POST'])
def set_static():
    data = request.get_json()
    interface = data.get('interface')
    ip = data.get('ip')
    subnet = data.get('subnet')
    gateway = data.get('gateway')

    # SIMULATION:
    message = f"[SIMULATED] Set static IP {ip} on {interface} with subnet {subnet} and gateway {gateway}"
    log_action("Set Static IP", ip, message)
    
    # Uncomment below for real config (⚠️ admin required)
    """
    try:
        if platform.system().lower() == "windows":
            subprocess.run(f'netsh interface ip set address name="{interface}" static {ip} {subnet} {gateway}', shell=True)
        else:
            subprocess.run(['sudo', 'ifconfig', interface, ip, 'netmask', subnet])
            subprocess.run(['sudo', 'route', 'add', 'default', 'gw', gateway])
    except Exception as e:
        return jsonify({"message": f"Failed: {str(e)}"}), 500
    """

    return jsonify({"message": message})

# Enable DHCP (Simulated)
@app.route('/enable_dhcp', methods=['POST'])
def enable_dhcp():
    data = request.get_json()
    iface = data.get('iface')
    message = f"[SIMULATED] Enabled DHCP on {iface}"
    log_action("Enable DHCP", iface, message)
    return jsonify({'message': message})

# SSH Connect (Simulated)
@app.route('/ssh', methods=['POST'])
def ssh_connect():
    data = request.get_json()
    ip = data.get('ip')
    user = data.get('user')
    message = f"[SIMULATED] Trying to SSH into {user}@{ip}"
    log_action("SSH Connect", ip, message)
    return jsonify({'message': message})

# SCP Transfer (Simulated)
@app.route('/scp', methods=['POST'])
def scp_transfer():
    data = request.get_json()
    source = data.get('from')
    destination = data.get('to')
    message = f"[SIMULATED] Transferred from {source} to {destination}"
    log_action("SCP Transfer", "-", message)
    return jsonify({'message': message})

# Ping
@app.route('/ping', methods=['POST'])
def ping():
    data = request.get_json()
    ip = data.get('ip')
    count_flag = '-n' if platform.system().lower() == 'windows' else '-c'
    cmd = f'ping {count_flag} 4 {ip}'

    try:
        output = subprocess.check_output(cmd, stderr=subprocess.STDOUT, shell=True).decode()
        log_action("Ping", ip, "Success")
        return jsonify({'output': output})
    except subprocess.CalledProcessError as e:
        error_output = e.output.decode() if e.output else 'Ping failed'
        log_action("Ping", ip, error_output)
        return jsonify({'output': error_output}), 500

# Traceroute
import subprocess
import platform
from flask import request, jsonify

@app.route('/traceroute', methods=['POST'])
def traceroute():
    try:
        ip = request.json.get("ip")
        if not ip:
            return jsonify({"status": "error", "message": "No IP provided"})

        system_platform = platform.system().lower()

        if "windows" in system_platform:
            cmd = ["tracert", ip]
        else:
            cmd = ["traceroute", ip]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        return jsonify({
            "status": "success",
            "output": result.stdout
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        })


    try:
        output = subprocess.check_output(cmd, stderr=subprocess.STDOUT, shell=True).decode()
        log_action("Traceroute", ip, "Success")
        return jsonify({'output': output})
    except subprocess.CalledProcessError as e:
        log_action("Traceroute", ip, "Failed")
        return jsonify({'output': e.output.decode() if e.output else 'Traceroute failed'}), 500

# Real-time Network Info
import psutil
import socket
from flask import jsonify

@app.route('/network_info')
def network_info():
    try:
        interfaces = psutil.net_if_addrs()
        result = {}

        for iface, addrs in interfaces.items():
            iface_info = {}
            for addr in addrs:
                if addr.family == socket.AF_INET:
                    iface_info["IPv4"] = addr.address
                    iface_info["Netmask"] = addr.netmask
                elif addr.family == psutil.AF_LINK or addr.family == socket.AF_PACKET:
                    iface_info["MAC"] = addr.address
            result[iface] = iface_info

        return jsonify({"status": "success", "interfaces": result})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})


# System Info
@app.route('/system_info')
def system_info():
    diagnostics = {
        "OS": platform.platform(),
        "CPU Usage (%)": psutil.cpu_percent(interval=1),
        "RAM Usage (%)": psutil.virtual_memory().percent
    }

    try:
        netstat_output = subprocess.check_output(["netstat", "-n"], stderr=subprocess.STDOUT)
        diagnostics["Network Connections"] = netstat_output.decode(errors="ignore")
    except Exception as e:
        diagnostics["Network Connections"] = f"Error: {str(e)}"

    return jsonify({"diagnostics": diagnostics})

# Export Logs
@app.route('/export')
def export_csv():
    import csv
    from io import StringIO
    logs = logs_collection.find().sort('_id', -1)
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["Timestamp", "Action", "IP", "Details"])
    for log in logs:
        writer.writerow([
            log.get("timestamp", ""),
            log.get("action", ""),
            log.get("ip", ""),
            log.get("details", "")
        ])
    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=logs.csv"}
    )

# View Logs
@app.route('/logs')
def view_logs():
    logs = list(logs_collection.find().sort("_id", -1))
    return render_template('logs.html', logs=logs)

# Run Flask App
if __name__ == '__main__':
    app.run(debug=True)
