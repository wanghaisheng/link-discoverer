# Link Discoverer

For our scraping needs, we found it useful to break up the crawl and the scrape into different libraries. This is just the crawler, which returns a deduped array of urls for a given website.

## Clone and Install Dependencies

``` bash
git clone https://github.com/tylrhas/link-discoverer.git
cd link-discoverer
npm i

# TO RUN
npm run dev
# OR
node index.js
```

## heroku



[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/wanghaisheng/link-discoverer/tree/master)


## GCloud Cloud Run Deploy

You need an authenticated GCloud account with a project will billing configured and access to IAM and Cloud Run services.

You also need the project name, which is referenced as `$GCP_PROJECT_ID` below.

``` bash
gcloud iam service-accounts create link-discoverer-identity

gcloud run deploy link-discoverer \
  --image gcr.io/$GCP_PROJECT_ID/link-discoverer \
  --service-account rover-identity \
  --no-allow-unauthenticated
```
Select [1] for Cloud Run (fully managed)
Select [21] for us-west1 region

> Record Service URL from response and the sevice-account name you provided. Those will be used by the service invoking this run.

