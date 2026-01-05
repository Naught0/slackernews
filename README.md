# slackernews

an alternative frontend to hackernews.

![](https://www.jamese.dev/slackernews.webp)

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
- [x] Scroll position determines which comment anchors you can jump to
   - e.g. if the scroll idx is 0 and you scroll to idx 20, the down button should take you to 21
- [ ] Persistent settings (Cookies?)
    - [ ] Ability to toggle on/off HN link replacement

TODO:

- [ ] Redirect comment IDs used on on `/post` route to `/comment` page instead
- [ ] Validate a comment belongs to a post so that a comment cannot be displayed under an unrelated post
- [ ] Investigate race condition between scroll restore and collapsible component reading session storage for initial state
- [ ] Fix loading state for homepages
- [ ] Fix comment flashing before redirecting to post when supplying a postId to `/comment`
