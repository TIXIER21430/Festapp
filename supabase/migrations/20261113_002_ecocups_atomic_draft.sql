-- FEST'APP: proposition additive NON APPLIQUÉE. Base de TEST uniquement après validation.
-- À exécuter APRÈS 20261113_001_festapp_draft.sql.
-- Toutes les écritures écocups doivent passer par cette RPC, jamais par INSERT client direct.
revoke insert on festapp.ecocup_movements from authenticated;

create or replace function festapp.record_ecocup_movement(
  p_kind text,
  p_quantity integer,
  p_idempotency_key uuid,
  p_event_id uuid default null,
  p_reason text default null
)
returns festapp.ecocup_movements
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing festapp.ecocup_movements%rowtype;
  v_result festapp.ecocup_movements%rowtype;
  v_balance bigint;
  v_delta bigint;
  v_actor uuid;
begin
  v_actor := auth.uid();
  if v_actor is null or not festapp.is_active_bureau() then
    raise exception 'Accès non autorisé' using errcode = '42501';
  end if;
  if p_idempotency_key is null or p_quantity is null or p_quantity <= 0 then
    raise exception 'Clé et quantité positive obligatoires' using errcode = '22023';
  end if;
  if p_kind is null or p_kind not in ('initial','purchase','out','return','loss','adjust_in','adjust_out') then
    raise exception 'Type de mouvement invalide' using errcode = '22023';
  end if;
  if p_kind in ('adjust_in','adjust_out') and nullif(pg_catalog.btrim(p_reason),'') is null then
    raise exception 'Motif de correction obligatoire' using errcode = '22023';
  end if;

  -- Verrou GLOBAL par transaction : tous les mouvements du stock partagé sont sérialisés.
  -- Un seul stock physique pour tout le comité ; event_id n'est qu'une référence.
  perform pg_catalog.pg_advisory_xact_lock(21430, 20261113);

  select * into v_existing from festapp.ecocup_movements
  where idempotency_key = p_idempotency_key;
  if found then
    if v_existing.created_by <> v_actor or v_existing.kind <> p_kind
       or v_existing.quantity <> p_quantity
       or v_existing.event_id is distinct from p_event_id
       or v_existing.reason is distinct from p_reason then
      raise exception 'Clé de répétition déjà utilisée avec un autre mouvement' using errcode = '23505';
    end if;
    return v_existing;
  end if;

  select coalesce(sum(case when kind in ('initial','purchase','return','adjust_in')
      then quantity::bigint else -quantity::bigint end), 0)
  into v_balance from festapp.ecocup_movements;

  v_delta := case when p_kind in ('initial','purchase','return','adjust_in')
    then p_quantity::bigint else -p_quantity::bigint end;
  if v_balance + v_delta < 0 then
    raise exception 'Stock écocups insuffisant' using errcode = '23514';
  end if;

  insert into festapp.ecocup_movements
    (event_id,kind,quantity,reason,idempotency_key,created_by)
  values (p_event_id,p_kind,p_quantity,p_reason,p_idempotency_key,v_actor)
  returning * into v_result;
  return v_result;
end;
$$;

revoke all on function festapp.record_ecocup_movement(text,integer,uuid,uuid,text)
  from public, anon;
grant execute on function festapp.record_ecocup_movement(text,integer,uuid,uuid,text)
  to authenticated;

-- ATTENTION : la fonction doit appartenir à un rôle DB de confiance avec accès aux tables.
-- Aucun droit d'écriture direct aux comptes authentifiés. Vérifier sur base isolée
-- qu'aucun autre rôle/API ne peut contourner la RPC et que l'API expose le schéma festapp.
