---
title: "WordBoard"
slug: wordboard
summary: "A full-stack blog platform built on the MEAN stack, letting individuals, groups, and organizations spin up their own blog site with Facebook sign-in, posts, and comments."
technologies:
  - name: "Angular 5 & ng-bootstrap"
    why: "Frontend single-page app and UI components (navbar, forms, modals) for browsing, creating, and editing blog posts."
  - name: "angular4-social-login"
    why: "Handled Facebook OAuth sign-in, so first-time users could create a blog account with existing Facebook credentials instead of a new password."
  - name: "angular2-markdown"
    why: "Rendered blog post content as markdown, so authors could format posts without a rich-text editor."
  - name: "Express & Mongoose"
    why: "A REST API (GET/POST/PUT/DELETE on /posts) backed by MongoDB, built as its own service (wordboard-backend) separate from the Angular frontend."
decisions:
  - decision: "Split the application into two independently deployable services: an Angular frontend (wordboard-frontend) and an Express/Node REST API (wordboard-backend), talking over HTTP with CORS enabled between them."
    rejectedAlternative: "A single server-rendered app. The backend's dependencies include an EJS templating engine, but it's never used to render pages, only as leftover scaffolding, since the actual design serves a JSON API to a separate Angular client."
  - decision: "Modeled comments as an embedded subdocument array on each Post document, rather than a separate Comments collection, and added a comment by pushing it onto that array client-side and re-saving the whole post through the existing PUT /posts/:id endpoint."
    rejectedAlternative: "A dedicated Comment collection with its own endpoints (e.g. POST /posts/:id/comments). Since a comment never exists outside the context of its post, embedding it kept a post and all of its comments in one document and one query."
result: "TODO: a real, ideally measurable outcome — this was a module project rather than a deployed product, so there's no live-usage number; consider whether there's a grade, demo feedback, or specific milestone worth naming instead."
learned: "TODO: a genuine reflection on what building this taught you about the MEAN stack, splitting a frontend and backend into separate services, or working with a third-party OAuth provider."
order: 3
githubUrl: "https://github.com/changkw/dwad"
---

**WordBoard** was a Dynamic Web Application Development module project: a full-stack blog-creation platform built on the MEAN stack (MongoDB, Express, Angular, Node), with the frontend and backend kept in separate folders so each could potentially be deployed independently.

## Problem

The goal was to let anyone, from an individual to a group to an organization, spin up a blog site: authors create, edit, and delete posts; commentators comment on them; readers read them. The app was deliberately kept feature-minimal so it could serve as a base for more specialized blogs built on top of it, rather than a single-purpose product.

## Approach

A user signs in with their Facebook account rather than creating a new one. Once authenticated, they can create a post from a template, edit or delete their own posts, and comment on any post. Readers who aren't signed in can still browse and read every post on the site. The data model behind this is intentionally small: a `Post` (id, title, content, author, date) with an embedded list of `Comment`s (id, content, author, date).

## Technical decisions

The frontend and backend live in separate folders, `wordboard-frontend` (Angular, talking to the API over `HttpClient`) and `wordboard-backend` (an Express/Mongoose REST API), communicating over HTTP with CORS enabled. That separation meant either side could be swapped out or deployed on its own.

On the data side, comments are stored as an embedded array on their parent `Post` document instead of living in their own collection. Adding a comment happens client-side, by pushing the new comment into that array and sending the whole post back through the existing `PUT /posts/:id` route, so there was no need for a separate comment-specific endpoint.

## Implementation

The backend exposes a small REST API under `/posts` (list, get one, create, update, delete), backed by two Mongoose schemas, `Post` and an embedded `Comment`, with a Mongoose virtual mapping MongoDB's `_id` to a plain `id` field in the JSON responses. The Angular frontend uses `SocialLoginModule` with a Facebook login provider for authentication, `ng-bootstrap` for the UI shell, and `angular2-markdown` to render each post's content, all driven through a single `PostService` that wraps the REST API calls.

## Testing

**TODO:** the project scaffolding includes Karma/Jasmine/Protractor test files, but they're the default Angular CLI boilerplate (e.g. `expect(service).toBeTruthy()`), not tests written against WordBoard's actual behavior. If you did any real manual or automated testing beyond that, describe it here.

## Results

**TODO:** add a real outcome — this was built as a module project rather than shipped to real users, so note whatever's genuinely true: a grade, instructor/peer feedback, or a specific milestone reached.

## What I learned

**TODO:** a genuine reflection — what surprised you about splitting a frontend and backend into separate deployable services, working with Facebook's OAuth, or modeling comments as embedded documents, or what you'd do differently.
