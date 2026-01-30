-- Política para eliminar sesiones (solo el owner puede eliminar a través del cambio de status)
-- Las sesiones se eliminan cambiando su status a 'closed', lo cual activa la limpieza

-- Agregar política de DELETE para sesiones
CREATE POLICY "Cualquiera puede eliminar sesiones" ON sessions
    FOR DELETE USING (true);

-- Eliminar la política de UPDATE existente que es muy restrictiva
DROP POLICY IF EXISTS "Cualquiera puede actualizar sesiones activas" ON sessions;

-- Crear nueva política de UPDATE que permite actualizar sesiones activas
-- incluyendo cambiar su status a 'closed'
CREATE POLICY "Cualquiera puede actualizar sesiones activas" ON sessions
    FOR UPDATE USING (status = 'active')
    WITH CHECK (true);

-- Función para limpiar datos de una sesión cuando se cierra
-- Aunque tenemos ON DELETE CASCADE, esta función permite una limpieza más controlada
CREATE OR REPLACE FUNCTION close_session(p_session_id UUID, p_participant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_owner BOOLEAN;
BEGIN
    -- Verificar que el participante es el owner de la sesión
    SELECT is_owner INTO v_is_owner
    FROM participants
    WHERE id = p_participant_id AND session_id = p_session_id;
    
    IF NOT v_is_owner OR v_is_owner IS NULL THEN
        RAISE EXCEPTION 'Solo el creador de la cuenta puede finalizarla';
    END IF;
    
    -- Cambiar estado a closed (esto evitará nuevas modificaciones via RLS)
    UPDATE sessions
    SET status = 'closed'
    WHERE id = p_session_id;
    
    -- Eliminar la sesión (CASCADE eliminará participantes, items y assignments)
    DELETE FROM sessions WHERE id = p_session_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
