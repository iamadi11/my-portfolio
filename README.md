This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Make it yours

The site is driven by one file, so it works for any engineer (SDE-2, SDE-3, tech lead):

1. Edit `src/content/site.ts`: profile, projects (pick a `mark` drawing and `hue` for each), experience, skills. Leave out what you can't back up; empty sections disappear.
2. Guide on `/`: set `HOST.portrait` and `HOST.voice` (a Kokoro voice id). For the 3D head, export your avatar from a front-facing photo with the [LAM demo](https://www.modelscope.cn/studios/Damo_XR_Lab/LAM_Large_Avatar_Model), save it as `public/avatar/<you>.zip` and set `HOST.avatar`; without that file the guide stays a photo.
3. `npm run voice` (needs `ffmpeg`) renders every line the host can say into `public/voice/`; `npm run check:host` checks the answers.
4. `src/components/instrumented/content.ts` → `SAMPLE` shows every field with placeholder copy.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

#Authot @Aditya Raj
