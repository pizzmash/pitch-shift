## ADDED Requirements
### Requirement: Independent pitch adjustment
The extension SHALL change pitch from -12 to +12 semitones without changing video playback speed.
#### Scenario: Raise the key
- **WHEN** a user presses the pitch plus button on a YouTube video
- **THEN** pitch increases by one semitone and playback speed remains unchanged
#### Scenario: Return to original key
- **WHEN** pitch is set to zero
- **THEN** audio capture stops and normal tab playback resumes
#### Scenario: Existing session in another tab
- **WHEN** pitch adjustment is requested while another tab owns the session
- **THEN** the extension displays an actionable error and preserves the existing session

### Requirement: Playback speed
The extension SHALL adjust playback speed from 0.25 to 2.0 in increments of 0.05 while preserving pitch.
#### Scenario: Slow practice
- **WHEN** the user chooses the 0.75 preset
- **THEN** the video plays at 0.75 speed with pitch preservation enabled

### Requirement: Rewind
The extension SHALL rewind by a user-selected integer from 1 to 60 seconds and persist that preference.
#### Scenario: Rewind near the beginning
- **WHEN** rewind exceeds the elapsed video time
- **THEN** playback seeks to the earliest available time

### Requirement: Clear accessible controls
The extension SHALL provide Japanese labels, keyboard-accessible buttons, current values, reset, loading and error feedback.
#### Scenario: Unsupported page
- **WHEN** the popup opens outside YouTube or without a video
- **THEN** playback controls are disabled and instructions are displayed
#### Scenario: Reset practice
- **WHEN** the user resets controls
- **THEN** speed returns to 1 and pitch returns to 0
