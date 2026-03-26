import os
import subprocess
import sys
import platform

def run_command(command, shell=True):
    print(f"Executing: {command}")
    try:
        subprocess.check_call(command, shell=shell)
    except subprocess.CalledProcessError as e:
        print(f"Error executing command: {e}")
        return False
    return True

def main():
    print("--- The MoneyShot Installer (Python Bridge) ---")
    
    # 1. Detect OS
    is_windows = platform.system() == "Windows"
    
    # 2. Check for dependencies
    print("Checking dependencies...")
    try:
        subprocess.check_output(["python", "--version"])
        subprocess.check_output(["node", "--version"])
    except FileNotFoundError:
        print("Required software (Python/Node) missing.")
        sys.exit(1)

    # 3. Create Venv
    if not os.path.exists("venv"):
        run_command("python -m venv venv")

    # 4. Install requirements
    pip_path = os.path.join("venv", "Scripts", "pip") if is_windows else os.path.join("venv", "bin", "pip")
    run_command(f"{pip_path} install -r requirements.txt")

    # 5. NPM Install root and electron
    run_command("npm install")
    if os.path.exists("electron"):
        os.chdir("electron")
        run_command("npm install")
        os.chdir("..")

    # 6. Database
    python_path = os.path.join("venv", "Scripts", "python") if is_windows else os.path.join("venv", "bin", "python")
    run_command(f"{python_path} manage.py migrate")
    run_command(f"{python_path} manage.py seed_pos")

    print("\n[SUCCESS] The MoneyShot is staged and ready.")

if __name__ == "__main__":
    main()
