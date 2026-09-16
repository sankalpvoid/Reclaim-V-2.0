update public.learning_articles
set body = replace(body, E'\\n', E'\n'), updated_at = now()
where body like '%\\n%';
