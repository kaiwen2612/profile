---
title: "Avataryze: AI-Driven Avatar Animation Platform"
slug: ai-avatar-platform
summary: "A web platform (final-year capstone project) that generates talking digital avatar videos from a photo and a presenter video, for content creators and influencers."
technologies:
  - name: "Python & Flask"
    why: "Backend and server-rendered frontend (Jinja templating) for the whole platform, a lightweight framework choice that matched the scope of a solo capstone build."
  - name: "PyTorch"
    why: "Used to load and run pre-trained face-reenactment models (keypoint detection, head-pose estimation, an occlusion-aware generator) for inference, rather than training a model from scratch."
  - name: "OpenCV"
    why: "Image and video frame processing: resizing avatar images, colour-space conversion, and frame-by-frame handling during animation."
  - name: "ffmpeg"
    why: "Extracted audio from the uploaded presenter video, then remuxed the generated animation with that audio into the final video."
  - name: "Redis"
    why: "TODO: the report confirms Redis was used for data storage but doesn't explain why over a relational database, fill in the real reasoning."
  - name: "Google Cloud Platform"
    why: "Hosted the server on a GCP compute instance, applying cloud-computing coursework directly to a real deployment."
decisions:
  - decision: "Built the avatar animation core on adapted pre-trained models (a keypoint detector, a head-pose estimator, and an occlusion-aware generator) rather than training a new model."
    rejectedAlternative: "Training a talking-head model from scratch. The project's own literature review surveyed over a dozen recent research systems, each trained on large datasets (VoxCeleb, HDTF, CelebV-HQ) with substantial GPU time, not feasible for a single-person capstone on its own timeline."
  - decision: "Required custom avatar uploads to go through an admin review-and-approval step, with automated email notifications, before they could be used to generate videos."
    rejectedAlternative: "Accepting any uploaded image immediately, which was rejected to keep a content-moderation checkpoint in a product meant for public-facing influencer content."
result: "Benchmarked against Hallo (a published research system) in an 18-participant realism study, the platform's videos were consistently rated less realistic on a 5-point scale: a measured gap against a state-of-the-art baseline, not an assumption. Generation time scaled with video duration (~25.5s for 10s, ~127s for 60s) but was unaffected by avatar image resolution (256×256 vs 512×512), and GPU memory stayed flat at 1.65GB regardless of length or resolution. A separate 12-participant usability study found 75% satisfied or very satisfied with the end-to-end flow (register, log in, generate a video)."
learned: "Working hands-on with pre-trained computer-vision models gave a much deeper practical understanding of how talking-head generation actually works than reading the papers alone. Running the full Scrum process solo (product owner, developer, and everything between) was good, if artificial, rehearsal for team practice. The realism gap against Hallo was the clearest signal in the whole project: matching a dedicated research system's output needs either a stronger pre-trained backbone or fine-tuning on avatar-specific data, which the capstone timeline didn't allow."
githubUrl: "https://github.com/kaiwen2612/avataryze-code"
order: 1
---

**Avataryze** was my final-year capstone project (CSC3001, SIT–University of Glasgow joint degree, supervised by Prof. Cao Qi): a web platform that turns a photo and a presenter video into a talking digital avatar video, aimed at influencers who want to create content without appearing on camera themselves.

## Problem

Digital avatars are increasingly used for scaled, personalized digital communication. The underlying market is projected to grow roughly 50x between 2020 and 2030. My project's specific goal was narrower: give influencers a way to generate engaging talking-avatar videos themselves, without technical expertise, so they could expand their content output while keeping their own identity (via a custom avatar) or using a ready-made one.

## Approach

An influencer logs in, chooses one of two pre-generated avatars or uploads a custom photo (which goes through an admin approval step before it's usable), then uploads a short presenter video of themselves talking. The system extracts the audio from that video, animates the chosen avatar's face to match the presenter's expressions and movements frame by frame, and re-syncs the result with the original audio, producing a new video of the avatar "speaking" the presenter's words.

## Technical decisions

The animation core loads three pre-trained models (a keypoint detector, a head-pose estimator, and an occlusion-aware generator) rather than training anything from scratch. My own literature review made the alternative concrete: the closest published systems train on datasets like VoxCeleb and HDTF with substantial GPU time, which was never realistic for a single capstone timeline. Adapting existing models let me focus the project on the product (the upload, approval, and generation pipeline) rather than model research.

I also gated custom avatar uploads behind an admin approval workflow with email notifications at each step, rather than letting any uploaded image go straight into video generation. For a tool meant to produce public-facing content, that review step is the one place inappropriate uploads can be caught before they reach the generation pipeline.

## Implementation

The backend is a Flask app with a Jinja-templated frontend. A Redis store handles data, and the server runs on a Google Cloud Platform instance. The generation pipeline itself is three steps: extract audio from the presenter video with ffmpeg, animate the selected avatar frame-by-frame with the loaded PyTorch models (detecting and transforming facial keypoints per frame, using OpenCV for the image handling), then remux the animated frames with the extracted audio, again via ffmpeg.

## Testing

I ran two structured user studies rather than relying on my own judgment of quality. An 18-participant realism study had people rate paired videos (one from Avataryze, one from Hallo, a published research system) on a 5-point realism scale, across three different source videos. A separate 12-participant usability study had people complete the real end-to-end flow (register, log in, generate a video) and rate their satisfaction.

## Results

The realism comparison was the most useful, and least flattering, result: across all three video pairs, participants rated the Hallo-generated video as more realistic than Avataryze's output. That's a direct, measured comparison against a real research baseline, not a guess. On the performance side, generation time tracked video duration almost linearly (~25.5s for a 10-second clip up to ~127s for 60 seconds) and was completely unaffected by whether the avatar image was 256×256 or 512×512; GPU memory use held steady at 1.65GB across every combination tested. The usability study came out more positively: 6 of 12 participants were very satisfied and 3 more satisfied with the actual product flow, a 75% positive rate, with the rest neutral or unsatisfied.

## What I learned

The realism gap against Hallo was the single clearest piece of evidence to come out of the project: producing state-of-the-art output quality needs either a stronger pre-trained backbone than the one I adapted, or fine-tuning on avatar-specific data, neither of which fit inside the capstone's scope. Beyond the technical result, running the entire Scrum process by myself (sprint planning, reviews, retrospectives, every role at once) was a useful, if unusual, way to internalize a process I'd otherwise only have seen from one seat on a team.
