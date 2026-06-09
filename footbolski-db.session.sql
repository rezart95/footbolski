-- 1. Remove all player positions from both teams
-- DELETE FROM team_players
-- WHERE team_id IN (
--   SELECT id FROM teams WHERE event_id = '5031d8a9-01d6-4bc0-8ba3-7f61ae4ec340'
-- );

-- Delete the teams
-- DELETE FROM teams
-- WHERE event_id = '5031d8a9-01d6-4bc0-8ba3-7f61ae4ec340';

-- Reset the event
-- UPDATE events
-- SET teams_generated = false,
--     ai_reasoning    = NULL,
--     ai_swap_options = NULL
-- WHERE id = '5031d8a9-01d6-4bc0-8ba3-7f61ae4ec340';

-- DELETE FROM team_players WHERE team_id IN (SELECT id FROM teams WHERE event_id = '7dd2b59e-7133-4ea4-b318-173b66a9401e');
-- DELETE FROM teams WHERE event_id = '7dd2b59e-7133-4ea4-b318-173b66a9401e';
-- DELETE FROM registrations WHERE event_id = '7dd2b59e-7133-4ea4-b318-173b66a9401e';
-- DELETE FROM events WHERE id = '7dd2b59e-7133-4ea4-b318-173b66a9401e';

SELECT * FROM players

-- UPDATE events
-- SET pay_to_name = 'Rezart Abazi'
-- WHERE id = 'eb5bcdee-de09-45e9-b17f-528042569fd6';