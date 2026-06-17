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


-- UPDATE events
-- SET pay_to_name = 'Rezart Abazi'
-- WHERE id = 'eb5bcdee-de09-45e9-b17f-528042569fd6';


-- UPDATE players
-- SET
--   notes = CASE id
--     WHEN '2df5dd3e-8b17-4250-b4c4-5eacb9104998' THEN 'Good finisher. Tends to hold the ball too long.'
--     WHEN '70d8bfad-9b6a-43c6-9866-1147ed36b441' THEN 'Best player in the group. Great dribbling, shooting, long and short passes. No real weaknesses.'
--     WHEN '91b644f2-bb38-4f0d-9244-2fc15149bdd1' THEN 'Good positioning and vision. Below average acceleration and fitness.'
--     WHEN '0ce48c45-dd2b-46a3-b518-2dbbcf18fa73' THEN 'Fastest player. Great stamina and acceleration. Weak positioning, passing, and close control.'
--     WHEN '1fd6f748-0483-452f-b4b5-15d4e71dcaf9' THEN 'Good goalkeeper. Also plays midfield. Weak acceleration and passing.'
--     WHEN '67832355-dbe7-4c48-b424-21a212e63d8c' THEN 'Good vision, occasionally gives great passes. Below average speed, technique, and shooting.'
--     WHEN 'c6a87bc0-8a27-45c6-94ae-d0ee730959c6' THEN 'Good dribbling and passing. Weak in aerial duels. Does not track back.'
--     WHEN '7d0689f6-1126-4f1b-b7fb-8344640f29b1' THEN 'Good tackling. Weak shooting and limited dribbling.'
--     WHEN '8408c43f-45ff-4a2a-9929-9ccc3410c10c' THEN 'Slightly overweight but good positional skills. Good area cover and anticipation in defence. Decent long-range shooting. Below average speed.'
--     WHEN '99d4a0f6-7d93-4fcc-922b-247e8228ce08' THEN 'Good player, quick on the wing and tries to dribble and shoot. Lacks finishing abilities.'
--     WHEN '7d584814-efa4-4e84-98d4-6af344a0bca1' THEN 'Technical player, makes very good passes and has good vision, positional.'
--     WHEN '48807028-d529-4ecb-b1fd-6dcdd58a158f' THEN 'Very good player, great passes and good defending.'
--     WHEN 'fedaba0a-92cd-4ca9-aa91-056ebc3f0b08' THEN 'New player, still learning. Does not give up. Weak in most attributes.'
--     WHEN '285b1711-49e8-4109-bf71-9617464262a2' THEN 'Young and energetic. Aggressive defending, not afraid to tackle. Runs the wings and likes to cross into the box. Good passer.'
--   END,
--   updated_at = NOW()
-- WHERE id IN (
--   '2df5dd3e-8b17-4250-b4c4-5eacb9104998', -- Noel Kume
--   '70d8bfad-9b6a-43c6-9866-1147ed36b441', -- Jetmir Çenko
--   '91b644f2-bb38-4f0d-9244-2fc15149bdd1', -- Rezart Abazi
--   '0ce48c45-dd2b-46a3-b518-2dbbcf18fa73', -- Giani Koçi
--   '1fd6f748-0483-452f-b4b5-15d4e71dcaf9', -- Mondi Shkoza
--   '67832355-dbe7-4c48-b424-21a212e63d8c', -- Klaus Mucelli
--   'c6a87bc0-8a27-45c6-94ae-d0ee730959c6', -- Flori Lulo
--   '7d0689f6-1126-4f1b-b7fb-8344640f29b1', -- Alex Mirashi
--   '8408c43f-45ff-4a2a-9929-9ccc3410c10c', -- Miguel Consuegra Aranda
--   '99d4a0f6-7d93-4fcc-922b-247e8228ce08', -- Lirim Hasani
--   '7d584814-efa4-4e84-98d4-6af344a0bca1', -- Piotr Turczyński
--   '48807028-d529-4ecb-b1fd-6dcdd58a158f', -- Stivi G
--   'fedaba0a-92cd-4ca9-aa91-056ebc3f0b08', -- Met Selita
--   '285b1711-49e8-4109-bf71-9617464262a2'  -- Enes Jashari
-- );



-- SELECT * FROM players

