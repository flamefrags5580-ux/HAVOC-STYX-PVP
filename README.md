# HAVOC STYX PvP System

This repository contains a Bedrock Script API addon scaffold for a HAVOC STYX PvP system.

Important:
- This is a best-effort Bedrock Script API addon intended for Minecraft Bedrock Edition 1.26.x.
- Some advanced features are implemented as safe skeletons or require additional platform-specific tuning.
- For real Bedrock gameplay, enable Script API / experimental features in the world and verify API names for your exact build.

## Included
- Compass menu
- Duel request flow
- FFA flow
- Clan flow
- Arena selection
- Kit application skeleton
- Admin tools skeleton
- Persistence via dynamic properties

## Install
1. Put the project folder in your Bedrock behavior packs folder.
2. Decode `pack_icon.b64` into `pack_icon.png`.
3. Create or edit a world and enable Script API / experimental features.
4. Start the world and verify the log shows `HAVOC STYX: Initialized`.

## Notes
- This is not a guaranteed drop-in production build for all Bedrock builds.
- Use this as a working starter and adjust any platform-specific API names to your exact Bedrock version.
