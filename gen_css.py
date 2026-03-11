def print_css_scale(theme, role, colors):
    print(f'html[data-theme="{theme}"][data-role="{role}"] {{')
    for weight, hex_val in colors.items():
        print(f'    --color-primary-{weight}: {hex_val};')
    # Add puddle variables based on primary
    print(f'    --bg-puddle-1: {colors["400"]};')
    print(f'    --bg-puddle-2: {colors["600"]};')
    print('}')


# Color definitions using Tailwind palettes
emerald = {'50': '#ecfdf5', '100': '#d1fae5', '200': '#a7f3d0', '300': '#6ee7b7', '400': '#34d399', '500': '#10b981', '600': '#059669', '700': '#047857', '800': '#065f46', '900': '#064e3b', '950': '#022c22'}
lime = {'50': '#f7fee7', '100': '#ecfccb', '200': '#d9f99d', '300': '#bef264', '400': '#a3e635', '500': '#84cc16', '600': '#65a30d', '700': '#4d7c0f', '800': '#3f6212', '900': '#365314', '950': '#1a2e05'}
indigo = {'50': '#eef2ff', '100': '#e0e7ff', '200': '#c7d2fe', '300': '#a5b4fc', '400': '#818cf8', '500': '#6366f1', '600': '#4f46e5', '700': '#4338ca', '800': '#3730a3', '900': '#312e81', '950': '#1e1b4b'}
cyan = {'50': '#ecfeff', '100': '#cffafe', '200': '#a5f3fc', '300': '#67e8f9', '400': '#22d3ee', '500': '#06b6d4', '600': '#0891b2', '700': '#0e7490', '800': '#155e75', '900': '#164e63', '950': '#083344'}
fuchsia = {'50': '#fdf4ff', '100': '#fae8ff', '200': '#f5d0fe', '300': '#f0abfc', '400': '#e879f9', '500': '#d946ef', '600': '#c026d3', '700': '#a21caf', '800': '#86198f', '900': '#701a75', '950': '#4a044e'}
rose = {'50': '#fff1f2', '100': '#ffe4e6', '200': '#fecdd3', '300': '#fda4af', '400': '#fb7185', '500': '#f43f5e', '600': '#e11d48', '700': '#be123c', '800': '#9f1239', '900': '#881337', '950': '#4c0519'}
amber = {'50': '#fffbeb', '100': '#fef3c7', '200': '#fde68a', '300': '#fcd34d', '400': '#fbbf24', '500': '#f59e0b', '600': '#d97706', '700': '#b45309', '800': '#92400e', '900': '#78350f', '950': '#451a03'}
yellow = {'50': '#fefce8', '100': '#fef9c3', '200': '#fef08a', '300': '#fde047', '400': '#facc15', '500': '#eab308', '600': '#ca8a04', '700': '#a16207', '800': '#854d0e', '900': '#713f12', '950': '#422006'}
sky = {'50': '#f0f9ff', '100': '#e0f2fe', '200': '#bae6fd', '300': '#7dd3fc', '400': '#38bdf8', '500': '#0ea5e9', '600': '#0284c7', '700': '#0369a1', '800': '#075985', '900': '#0c4a6e', '950': '#082f49'}

# Structural themes
dusk_vars = {
    '--color-white': '#ffffff',
    '--color-surface-900': '#020617',
    '--color-surface-800': '#0f172a',
    '--color-surface-700': '#1e293b',
    
    '--color-gray-50': '#f8fafc',
    '--color-gray-100': '#f1f5f9',
    '--color-gray-200': '#e2e8f0',
    '--color-gray-300': '#cbd5e1',
    '--color-gray-400': '#94a3b8',
    '--color-gray-500': '#64748b',
    '--color-gray-600': '#475569',
    '--color-gray-700': '#334155',
    '--color-gray-800': '#1e293b',
    '--color-gray-900': '#0f172a',
    '--color-gray-950': '#020617',
}

midnight_vars = {
    '--color-white': '#ffffff',
    '--color-surface-900': '#000000',
    '--color-surface-800': '#0a0a0a',
    '--color-surface-700': '#171717',
    
    '--color-gray-50': '#fafafa',
    '--color-gray-100': '#f5f5f5',
    '--color-gray-200': '#e5e5e5',
    '--color-gray-300': '#d4d4d4',
    '--color-gray-400': '#a3a3a3',
    '--color-gray-500': '#737373',
    '--color-gray-600': '#525252',
    '--color-gray-700': '#404040',
    '--color-gray-800': '#262626',
    '--color-gray-900': '#171717',
    '--color-gray-950': '#0a0a0a',
}

dawn_vars = {
    '--color-white': '#0f172a',    # dark slate for white text
    '--color-surface-900': '#ffffff',
    '--color-surface-800': '#f8fafc',
    '--color-surface-700': '#f1f5f9',
    
    # Inverted Grays
    '--color-gray-50': '#020617',
    '--color-gray-100': '#0f172a',
    '--color-gray-200': '#1e293b',
    '--color-gray-300': '#334155',
    '--color-gray-400': '#475569',
    '--color-gray-500': '#64748b',
    '--color-gray-600': '#94a3b8',
    '--color-gray-700': '#cbd5e1',
    '--color-gray-800': '#e2e8f0',
    '--color-gray-900': '#f1f5f9',
    '--color-gray-950': '#f8fafc',
}

def print_structural_vars(theme, vars_dict):
    print(f'html[data-theme="{theme}"] {{')
    for k, v in vars_dict.items():
        print(f'    {k}: {v};')
    print('}')


with open("static/src/input.css", "w") as f:
    f.write("@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n")
    f.write("@layer base {\n")

    f.write("  :root {\n")
    f.write("    --bg-puddle-1: #6366f1;\n")
    f.write("    --bg-puddle-2: #8b5cf6;\n")
    f.write("  }\n")
    
    import sys
    orig_stdout = sys.stdout
    sys.stdout = f
    
    # Global structural variables keyed purely by mode
    print_structural_vars('dusk', dusk_vars)
    print_structural_vars('midnight', midnight_vars)
    print_structural_vars('dawn', dawn_vars)
    
    # Role-based identity matrix
    # ADMIN
    print_css_scale('dawn', 'admin', emerald)
    print_css_scale('dusk', 'admin', lime)
    print_css_scale('midnight', 'admin', lime)
    
    # MANAGER
    print_css_scale('dawn', 'manager', indigo)
    print_css_scale('dusk', 'manager', cyan)
    print_css_scale('midnight', 'manager', sky)

    # CASHIER
    print_css_scale('dawn', 'cashier', fuchsia)
    print_css_scale('dusk', 'cashier', rose)
    print_css_scale('midnight', 'cashier', rose)

    # ACCOUNTING
    print_css_scale('dawn', 'accounting', amber)
    print_css_scale('dusk', 'accounting', yellow)
    print_css_scale('midnight', 'accounting', yellow)

    sys.stdout = orig_stdout
    f.write("}\n")
