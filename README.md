# 🍁 CanadaPathway — Complete Canadian Immigration Guide

A comprehensive, free Canadian immigration platform built to replace expensive lawyers and confusing government websites.

## Features

- **CRS Calculator** — Full Comprehensive Ranking System calculator with score breakdown
- **9 Immigration Sections** — Express Entry, PNP, Work Permits, Study, Visit, Family Sponsorship, Refugees, Fees, Settlement
- **AI Chatbot** — Powered by Google Gemini 1.5 Flash via serverless function
- **4 Languages** — English, Chinese (中文), Punjabi (ਪੰਜਾਬੀ), Spanish (Español)
- **Email Capture** — Lead generation ready
- **Affiliate Resource Cards** — Monetization ready
- **Dark Theme** — Professional design with animations and infographics

## Deployment to Vercel

### 1. Push to GitHub

```bash
cd canadapathway
git init
git add .
git commit -m "Initial commit — CanadaPathway"
git remote add origin https://github.com/YOUR_USERNAME/canadapathway.git
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Set **Framework Preset** to `Other`
4. Set **Output Directory** to `.` (root)
5. Add Environment Variable:
   - `GEMINI_API_KEY` = your Google AI Studio API key

### 3. Get a Gemini API Key

1. Go to [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it as `GEMINI_API_KEY` in Vercel Environment Variables

## Project Structure

```
canadapathway/
├── index.html          # Main application (React via CDN)
├── package.json        # Root config (type: module)
├── vercel.json         # Vercel routing config
├── .gitignore
├── README.md
└── api/
    ├── package.json    # API config (type: commonjs) ← IMPORTANT
    └── chat.js         # Gemini serverless function (module.exports)
```

## Why api/ has its own package.json

Vercel serverless functions in the `api/` folder need CommonJS format (`module.exports`) when your root `package.json` has `"type": "module"`. The separate `api/package.json` with `"type": "commonjs"` ensures the serverless function works correctly.

## Customization

- **Email capture**: Connect to your email service (Mailchimp, ConvertKit, etc.) by modifying the email form handler
- **Affiliate links**: Replace the resource card links with your actual affiliate URLs
- **Content updates**: Edit the `sectionContent` object in index.html to update immigration information
- **Styling**: All CSS variables are at the top of the `<style>` block for easy theming

## Disclaimer

This is an informational tool, not legal advice. Always verify information with [IRCC](https://www.canada.ca/en/immigration-refugees-citizenship.html) or a licensed immigration consultant (RCIC).
