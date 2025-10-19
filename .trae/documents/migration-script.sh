#!/bin/bash
# Script de migración a TypeScript para Map Tracker JW
# Rama: feature/ts-migration-services

set -e

echo "🚀 Iniciando migración a TypeScript - Map Tracker JW"
echo "📋 Rama: feature/ts-migration-services"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar que estamos en la rama correcta
current_branch=$(git branch --show-current 2>/dev/null || echo "unknown")
if [ "$current_branch" != "feature/ts-migration-services" ]; then
    log_warning "No estás en la rama feature/ts-migration-services"
    read -p "¿Quieres crear y cambiar a la rama? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Creando rama feature/ts-migration-services..."
        git checkout -b feature/ts-migration-services
        log_success "Rama creada y activada"
    else
        log_error "Migración cancelada"
        exit 1
    fi
fi

# Crear estructura de directorios
log_info "Creando estructura de directorios..."

mkdir -p frontend/js/types
mkdir -p frontend/js/utils
mkdir -p frontend/js/services
mkdir -p frontend/js/legacy

log_success "Estructura de directorios creada"

# Copiar configuración TypeScript
log_info "Configurando TypeScript para frontend..."

if [ ! -f "tsconfig.frontend.json" ]; then
    cat > tsconfig.frontend.json << 'EOF'
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": false,
    "allowJs": true,
    "checkJs": false,
    "noEmit": true,
    "isolatedModules": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "baseUrl": "./frontend",
    "paths": {
      "@/*": ["./js/*"],
      "@utils/*": ["./js/utils/*"],
      "@components/*": ["./js/components/*"],
      "@types/*": ["./js/types/*"],
      "@services/*": ["./js/services/*"]
    }
  },
  "include": [
    "frontend/js/**/*.ts",
    "frontend/js/**/*.d.ts",
    "frontend/js/**/*.js"
  ],
  "exclude": [
    "node_modules",
    "backend",
    "frontend/js/legacy"
  ]
}
EOF
    log_success "tsconfig.frontend.json creado"
else
    log_warning "tsconfig.frontend.json ya existe"
fi

# Función para migrar un archivo
migrate_file() {
    local source_file=$1
    local target_file=$2
    local file_name=$(basename "$source_file")
    
    log_info "Migrando $file_name..."
    
    # Crear backup
    if [ -f "$source_file" ]; then
        cp "$source_file" "frontend/js/legacy/${file_name}.bak"
        log_success "Backup creado: frontend/js/legacy/${file_name}.bak"
        
        # Copiar a nueva ubicación con extensión .ts
        cp "$source_file" "$target_file"
        log_success "Archivo copiado a: $target_file"
        
        # Aquí se pueden agregar transformaciones específicas
        # Por ejemplo, agregar tipos, imports, etc.
        
    else
        log_error "Archivo fuente no encontrado: $source_file"
        return 1
    fi
}

# Función para validar migración
validate_migration() {
    log_info "Validando migración..."
    
    # Compilar TypeScript
    if npx tsc --noEmit -p tsconfig.frontend.json; then
        log_success "Compilación TypeScript exitosa"
    else
        log_error "Errores de compilación TypeScript"
        return 1
    fi
    
    # Ejecutar tests si existen
    if [ -f "package.json" ] && grep -q "test" package.json; then
        log_info "Ejecutando tests..."
        if npm test; then
            log_success "Tests pasaron correctamente"
        else
            log_warning "Algunos tests fallaron - revisar manualmente"
        fi
    fi
}

# Función para rollback
rollback_file() {
    local file_name=$1
    local backup_file="frontend/js/legacy/${file_name}.bak"
    local original_file="frontend/js/${file_name}"
    
    if [ -f "$backup_file" ]; then
        cp "$backup_file" "$original_file"
        log_success "Rollback completado para $file_name"
    else
        log_error "Backup no encontrado para $file_name"
    fi
}

# Menú principal
show_menu() {
    echo ""
    echo "🔧 Opciones de migración:"
    echo "1) Sprint 1 - Migrar utilidades (json-utils, json-error-handler, ui)"
    echo "2) Sprint 2 - Migrar servicios simples (monitoring, gráficos, main)"
    echo "3) Sprint 3 - Migrar servicios críticos (dashboard, admin, capitanes)"
    echo "4) Migrar archivo específico"
    echo "5) Validar migración actual"
    echo "6) Rollback archivo específico"
    echo "7) Ver estado de migración"
    echo "8) Salir"
    echo ""
}

# Sprint 1 - Utilidades
sprint1() {
    log_info "🚀 Iniciando Sprint 1 - Utilidades"
    
    # Crear tipos base
    log_info "Creando definiciones de tipos..."
    # Aquí se copiarían los tipos desde el documento de planificación
    
    # Migrar archivos
    migrate_file "frontend/js/json-utils.js" "frontend/js/utils/json-utils.ts"
    migrate_file "frontend/js/json-error-handler.js" "frontend/js/utils/json-error-handler.ts"
    migrate_file "frontend/js/ui.js" "frontend/js/utils/ui.ts"
    
    validate_migration
    log_success "Sprint 1 completado"
}

# Sprint 2 - Servicios simples
sprint2() {
    log_info "🚀 Iniciando Sprint 2 - Servicios simples"
    
    migrate_file "frontend/js/monitoring-dashboard.js" "frontend/js/services/monitoring-dashboard.ts"
    migrate_file "frontend/js/grafica-progreso-barrios.js" "frontend/js/services/grafica-progreso-barrios.ts"
    migrate_file "frontend/js/main.js" "frontend/js/services/main.ts"
    
    validate_migration
    log_success "Sprint 2 completado"
}

# Sprint 3 - Servicios críticos
sprint3() {
    log_info "🚀 Iniciando Sprint 3 - Servicios críticos"
    
    migrate_file "frontend/js/dashboard.js" "frontend/js/services/dashboard.ts"
    migrate_file "frontend/js/capitanes.js" "frontend/js/services/capitanes.ts"
    migrate_file "frontend/js/mapas_consulta.js" "frontend/js/services/mapas_consulta.ts"
    migrate_file "frontend/js/admin.js" "frontend/js/services/admin.ts"
    
    validate_migration
    log_success "Sprint 3 completado"
}

# Estado de migración
migration_status() {
    log_info "📊 Estado de migración:"
    echo ""
    
    # Archivos TypeScript existentes
    ts_files=$(find frontend/js -name "*.ts" 2>/dev/null | wc -l)
    echo "📝 Archivos TypeScript: $ts_files"
    
    # Archivos JavaScript restantes
    js_files=$(find frontend/js -name "*.js" -not -path "*/legacy/*" 2>/dev/null | wc -l)
    echo "📄 Archivos JavaScript restantes: $js_files"
    
    # Backups creados
    backup_files=$(find frontend/js/legacy -name "*.bak" 2>/dev/null | wc -l)
    echo "💾 Backups creados: $backup_files"
    
    echo ""
    
    # Progreso por sprint
    echo "🎯 Progreso por Sprint:"
    
    # Sprint 1
    sprint1_files=("json-utils.ts" "json-error-handler.ts" "ui.ts")
    sprint1_completed=0
    for file in "${sprint1_files[@]}"; do
        if [ -f "frontend/js/utils/$file" ]; then
            ((sprint1_completed++))
        fi
    done
    echo "   Sprint 1: $sprint1_completed/${#sprint1_files[@]} archivos"
    
    # Sprint 2
    sprint2_files=("monitoring-dashboard.ts" "grafica-progreso-barrios.ts" "main.ts")
    sprint2_completed=0
    for file in "${sprint2_files[@]}"; do
        if [ -f "frontend/js/services/$file" ]; then
            ((sprint2_completed++))
        fi
    done
    echo "   Sprint 2: $sprint2_completed/${#sprint2_files[@]} archivos"
    
    # Sprint 3
    sprint3_files=("dashboard.ts" "capitanes.ts" "mapas_consulta.ts" "admin.ts")
    sprint3_completed=0
    for file in "${sprint3_files[@]}"; do
        if [ -f "frontend/js/services/$file" ]; then
            ((sprint3_completed++))
        fi
    done
    echo "   Sprint 3: $sprint3_completed/${#sprint3_files[@]} archivos"
    
    # Progreso total
    total_files=$((${#sprint1_files[@]} + ${#sprint2_files[@]} + ${#sprint3_files[@]}))
    total_completed=$((sprint1_completed + sprint2_completed + sprint3_completed))
    percentage=$((total_completed * 100 / total_files))
    
    echo ""
    echo "📈 Progreso total: $total_completed/$total_files archivos ($percentage%)"
}

# Loop principal
while true; do
    show_menu
    read -p "Selecciona una opción (1-8): " choice
    
    case $choice in
        1)
            sprint1
            ;;
        2)
            sprint2
            ;;
        3)
            sprint3
            ;;
        4)
            read -p "Nombre del archivo a migrar (sin extensión): " filename
            read -p "Directorio destino (utils/services): " target_dir
            migrate_file "frontend/js/${filename}.js" "frontend/js/${target_dir}/${filename}.ts"
            ;;
        5)
            validate_migration
            ;;
        6)
            read -p "Nombre del archivo para rollback: " filename
            rollback_file "$filename"
            ;;
        7)
            migration_status
            ;;
        8)
            log_info "Saliendo del script de migración"
            break
            ;;
        *)
            log_error "Opción inválida"
            ;;
    esac
    
    echo ""
    read -p "Presiona Enter para continuar..."
done

log_success "Script de migración finalizado"