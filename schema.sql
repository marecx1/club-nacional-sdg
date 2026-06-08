-- ===========================================================================
-- BASE DE DATOS CONTABLE Y SOCIAL - CLUB NACIONAL SDG 🇵🇾⚽
-- Script de configuración para editor SQL de Supabase (PostgreSQL)
-- ===========================================================================

-- 0. Tabla de Usuarios del Sistema
CREATE TABLE IF NOT EXISTS usuarios (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    rol TEXT NOT NULL,
    clave TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 1. Tabla de Socios
CREATE TABLE IF NOT EXISTS socios (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nro_socio TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    ci TEXT UNIQUE NOT NULL,
    telefono TEXT,
    email TEXT,
    categoria TEXT NOT NULL CHECK (categoria IN ('Titular', 'Familiar', 'Juvenil', 'Vitalicio')),
    estado TEXT NOT NULL CHECK (estado IN ('Activo', 'Moroso', 'Suspendido')),
    fecha_ingreso DATE DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE NOT NULL,
    foto TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. Tabla de Clientes Comerciales (Alquileres / ANDE)
CREATE TABLE IF NOT EXISTS clientes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre TEXT NOT NULL,
    ruc TEXT UNIQUE NOT NULL,
    telefono TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. Tabla de Ingresos (Cobros y Facturación)
CREATE TABLE IF NOT EXISTS ingresos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tipo_pagador TEXT NOT NULL CHECK (tipo_pagador IN ('socio', 'cliente', 'ocasional')),
    socio_id BIGINT REFERENCES socios(id) ON DELETE SET NULL,
    cliente_id BIGINT REFERENCES clientes(id) ON DELETE SET NULL,
    nombre_manual TEXT,
    ruc TEXT,
    categoria TEXT NOT NULL,
    concepto TEXT NOT NULL,
    monto NUMERIC NOT NULL CHECK (monto >= 0),
    metodo_pago TEXT NOT NULL,
    usuario TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 4. Tabla de Egresos (Gastos Contables)
CREATE TABLE IF NOT EXISTS egresos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    concepto TEXT NOT NULL,
    categoria TEXT NOT NULL,
    monto NUMERIC NOT NULL CHECK (monto >= 0),
    comprobante TEXT NOT NULL,
    usuario TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 5. Tabla de Estado de Caja Diaria (Turno Abierto/Cerrado)
CREATE TABLE IF NOT EXISTS caja_estado (
    id INT PRIMARY KEY DEFAULT 1,
    abierta BOOLEAN NOT NULL DEFAULT FALSE,
    monto_inicial NUMERIC DEFAULT 0,
    fecha_apertura TIMESTAMP WITH TIME ZONE,
    usuario TEXT,
    CONSTRAINT single_row CHECK (id = 1)
);

-- 6. Tabla de Historial de Cierres de Caja (Arqueos)
CREATE TABLE IF NOT EXISTS caja_historial (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fecha_apertura TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_cierre TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    monto_inicial NUMERIC NOT NULL,
    ingresos NUMERIC NOT NULL,
    egresos NUMERIC NOT NULL,
    monto_final NUMERIC NOT NULL,
    usuario TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 7. Tabla de Historial de Auditoría de Movimientos (Seguridad de Auditoría)
CREATE TABLE IF NOT EXISTS auditoria (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usuario TEXT NOT NULL,
    rol TEXT NOT NULL,
    accion TEXT NOT NULL,
    detalle TEXT NOT NULL
);

-- ===========================================================================
-- INSERCIÓN DE DATOS SEMILLA (REALISTAS DE PARAGUAY)
-- ===========================================================================

-- Usuarios del Sistema Iniciales
INSERT INTO usuarios (usuario, nombre, rol, clave, email) VALUES
('admin', 'Jonas Mareco', 'Administrador', 'admin123', 'jonasmareco28@gmail.com'),
('tesorero', 'Fredy', 'Tesorero', 'teso123', 'tesorero@clubnacional.org.py'),
('secretario', 'Lucas', 'Secretario', 'secre123', 'secretario@clubnacional.org.py'),
('consulta', 'Hugo Pitta', 'Consulta', 'con123', 'consulta@clubnacional.org.py')
ON CONFLICT (usuario) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    rol = EXCLUDED.rol,
    clave = EXCLUDED.clave,
    email = EXCLUDED.email;

-- Clientes Comerciales Iniciales
INSERT INTO clientes (nombre, ruc, telefono, email) VALUES
('Distribuidora El Sol S.A.', '80011122-3', '0981 999 888', 'contacto@elsol.com.py'),
('Supermercado Los Cedros', '80077733-4', '0972 111 222', 'administracion@loscedros.com.py'),
('Telecomunicaciones Guaraní', '80044455-5', '0991 333 444', 'pagos@tely.com.py')
ON CONFLICT DO NOTHING;

-- Socios Iniciales
INSERT INTO socios (nro_socio, nombre, ci, telefono, email, categoria, estado, fecha_ingreso, fecha_vencimiento, foto) VALUES
('CNSDG-1001', 'Ramón Alejandro González', '3.456.789', '0981 123 456', 'ramon.gonzalez@gmail.com', 'Titular', 'Activo', '2024-01-15', '2026-06-10', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150'),
('CNSDG-1002', 'Sofía Montserrat Recalde', '4.890.123', '0971 789 012', 'sofia.recalde@outlook.com', 'Familiar', 'Activo', '2024-03-20', '2026-06-15', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150'),
('CNSDG-1003', 'Nelson Haedo Benítez', '2.345.678', '0982 456 789', 'nelson.haedo@hotmail.com', 'Vitalicio', 'Activo', '2015-05-10', '2030-12-31', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150'),
('CNSDG-1004', 'Fátima Belén Espínola', '5.112.334', '0994 321 654', 'fatima.espinola@gmail.com', 'Juvenil', 'Moroso', '2025-02-10', '2026-04-10', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150')
ON CONFLICT DO NOTHING;

-- Caja Inicial Cerrada
INSERT INTO caja_estado (id, abierta, monto_inicial) VALUES (1, FALSE, 0)
ON CONFLICT DO NOTHING;

-- Historial de Arqueos de Caja
INSERT INTO caja_historial (fecha_apertura, fecha_cierre, monto_inicial, ingresos, egresos, monto_final, usuario) VALUES
('2026-05-20T08:00:00Z', '2026-05-20T18:00:00Z', 500000, 800000, 0, 1300000, 'Tesorero'),
('2026-05-21T08:00:00Z', '2026-05-21T18:00:00Z', 1300000, 0, 0, 1300000, 'Tesorero'),
('2026-05-22T08:00:00Z', '2026-05-22T18:00:00Z', 1300000, 0, 1200000, 100000, 'Tesorero');

-- Auditoría Inicial
INSERT INTO auditoria (usuario, rol, accion, detalle) VALUES
('admin', 'Administrador', 'INICIALIZAR_SISTEMA', 'Migración completa de la base de datos a PostgreSQL / Supabase realizada con éxito.');
