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

SELECT * from players
where notes is NOT NULL