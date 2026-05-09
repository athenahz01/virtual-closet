update storage.buckets
set allowed_mime_types = array[
  'image/heic',
  'image/heif',
  'image/jpeg',
  'image/png',
  'image/webp'
]
where id in ('items', 'avatars');
