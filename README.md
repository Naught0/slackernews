# slackernews

an alternative frontend to hackernews.

**Features**:

- [ ] Voting
- [ ] Sorting
- [ ] Filtering
- [x] User page
- [ ] Search
- [x] Dark/light mode
- [x] Homepages 
   - [x] new 
   - [x] past 
   - [x] comments 
   - [x] ask 
   - [x] show 
   - [x] jobs
- [ ] Scroll position determines which comment anchors you can jump to
   - e.g. if the scroll idx is 0 and you scroll to idx 20, the down button should take you to 21
- [ ] Persistent settings (Cookies?)
    - [ ] Ability to toggle on/off HN link replacement

TODO:

- [x] Increase width of user page to always be maximum
- [ ] Redirect comment IDs used on on `/post` route to `/comment` page instead
- [ ] Validate a comment belongs to a post so that a comment cannot be displayed under an unrelated post
- [x] Support full text of "Show HN" posts
