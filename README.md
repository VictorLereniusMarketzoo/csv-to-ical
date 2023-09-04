## Installation (local)

1. clone this repository
2. create `services/nodejs/.env` file (copy from `.env.example`)
3. run `docker compose up`

Now the service should be started on http://127.0.0.1:8010/

Default credentials: admin / admin

## Available endpoints

```
/api/slack?database=pixel-it&table=triggers&timestamp_key=created_at&filter.hostname=go.com.mt&filter.username=sms&workspace=marketzoo&channel=%23sms-it
```