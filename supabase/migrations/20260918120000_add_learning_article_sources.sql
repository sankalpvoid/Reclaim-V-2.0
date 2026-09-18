update public.learning_articles
set
  source_name = 'Smokefree.gov (National Cancer Institute)',
  source_url = 'https://smokefree.gov/challenges-when-quitting/cravings-triggers/how-manage-cravings',
  updated_at = now()
where slug = 'cravings-are-moments';

update public.learning_articles
set
  source_name = 'Smokefree.gov (National Cancer Institute)',
  source_url = 'https://smokefree.gov/challenges-when-quitting/cravings-triggers/know-your-triggers',
  updated_at = now()
where slug = 'honest-logging';

update public.learning_articles
set
  source_name = 'Smokefree.gov (National Cancer Institute)',
  source_url = 'https://smokefree.gov/challenges-when-quitting/withdrawal/managing-nicotine-withdrawal',
  updated_at = now()
where slug = 'check-in-without-scoring';

update public.learning_articles
set
  source_name = 'Smokefree.gov (National Cancer Institute)',
  source_url = 'https://smokefree.gov/quit-smoking/getting-started/build-your-support/ask-for-help',
  updated_at = now()
where slug = 'community-with-boundaries';

update public.learning_articles
set
  source_name = 'CDC',
  source_url = 'https://www.cdc.gov/tobacco/about/benefits-of-quitting.html',
  updated_at = now()
where slug = 'make-progress-visible';
