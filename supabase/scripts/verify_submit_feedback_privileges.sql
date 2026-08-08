SELECT 'submit_feedback_execute_anon' AS check_name,
  has_function_privilege('anon', 'public.submit_feedback(text,text,text,text,text,jsonb,jsonb,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid)'::regprocedure, 'EXECUTE')::int AS value
UNION ALL
SELECT 'submit_feedback_execute_authenticated',
  has_function_privilege('authenticated', 'public.submit_feedback(text,text,text,text,text,jsonb,jsonb,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid)'::regprocedure, 'EXECUTE')::int;
