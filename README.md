# Glaze Lab 🏺
> Ceramic Glaze Management and Calculation App — React Native / Expo

**Status** Work in progress - core features are functional, development continues

---

## What is this?
This dedicated tool for ceramic glaze recipe management originated from my personal hobby in ceramics. Its evolution, particularly the complex matrix calculations at its core, was made possible through a close and valuable collaboration with Päivi Vikberg.

The app implements Seger formula calculations in both directions:
* **Recipe → Seger:** input raw material amounts, get a normalized Seger formula.
* **Seger → Recipe:** input the desired Seger formula, get optimized raw material amounts.

The reverse calculation uses pseudoinverse and NNLS (Non-Negative Least Squares) optimization to ensure physically viable results (no negative raw material amounts).

---

## Technologies

* **Framework:** React Native + Expo (Expo Router)
* **Database:** expo-sqlite (local)
* **Matrix Calculation:** ml-matrix (pseudoinverse, NNLS)
* **Language:** TypeScript
* **Future Backend:** Supabase (PostgreSQL)

---

## Features

### Glaze List
* Add, delete, and archive glazes
* Swipe left to delete (swipe-to-delete)
* Long press → Cancel / Archive / Delete
* Multi-select and bulk delete
* Sort by name or temperature

### Calculator
* Recipe → Seger formula in real-time
* Seger → Recipe via matrix calculation
* A library of 79 raw materials directly in the database
 
---

## Architecture

```text
src/  
  app/            ← views (Expo Router)  
  components/     ← shared UI components    
  hooks/          ← database operations (repository layer)  
  lib/    
    glaze-engine  ← calculation engine, no UI dependencies    
    db.ts         ← SQLite connection and migrations
```
The calculation engine (glaze-engine.ts) is completely decoupled from the UI — switching the backend to Supabase will only require changes in the hooks/ layer.

---
**Getting started**
```Bash
npm install
npx expo start
```
The database is initialized and raw materials are seeded automatically on the first launch.

---

## Kehityssuunnitelma

- [ ] Supabase backend (cloud sync)
- [ ] Save and edit recipes
- [ ] Color oxide management
- [ ] Share glazes between users
- [ ] Document firing schedules

---

## Background
I am a ceramics hobbyist and a software development student. This project combines both — I wanted to build a tool I actually use, not just a practice app.

The mathematical foundation (Seger formula, matrix calculation) originates from Päivi Vikberg's Excel workbook, which I converted into a TypeScript calculation engine.
