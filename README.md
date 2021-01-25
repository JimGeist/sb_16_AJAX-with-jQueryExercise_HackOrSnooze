# sb_16_AJAX-with-jQueryExercise_HackOrSnooze

## Hack-or-Snooze 

Hack-or-Snooze is a clone of the Hacker News site. Hack-or-Snooze allows visitors to create accounts, log in, create articles, and mark favorites as some possible activities.

Please go to [Hack-or-Snooze](https://jimgeist.github.io/sb_16_AJAX-with-jQueryExercise_HackOrSnooze) for the application.


## Assignment Details
**ASSIGNMENT INVOLVED**:
- Code familiarization.
- Adding abilities for a logged in user:
  - to add a new story
  - to favorite and un-favorite any story
  - to see a separate list with their favorited stories
  - to remove their submitted stories
Honestly, from a learning point of view, Hack-or-Snooze seemed better suited for an assessment than for a general assignment.


**TIMING**:
- Time ran away on this assignment, but the time was not mostly in vain since there was a lot that I learned from this assignment. The assignment was started on January 17 and was completed on January 24. 40 hours worth of work went into this assignment.


**ENHANCEMENTS**:
Enhancements were added to increase the usability and flow of the program. There were some components that were not explicitly called out to add but were added to support some of the assignment requirements.
- User Profile view was added. This little bit of code provided a nice starting place to begin with the code.
- Added elements to html document for the navigation menu (submit | favorites | my stories). 
  - Should logged in html options get build from JavaScript or should they exist in the html but the visibility is controlled with JavaScript?
- Script tags were in the incorrect spot in the start code. The script includes were after the </body> tag. This issue was corrected.
- Added ability to unfavorite from the favorites list. 
  - Story is dropped from the favorites list when it is unfavorited. 
- Added ability to favorite or unfavorite from the my stories list.
- Helpful messaging added 
  - when stories are deleted, 
  - when no favorite stories were found for the favorites list, 
  - when no owned stories were found for the my stories list, 
- Error messaging added if user and / or password are incorrect or if errors occur while adding a story.


**STRUGGLES**:
- Figuring out first how everthing worked. Starting out with building the User Profile display helped with code familiarization.
- Error messaging. I wish this program had some basic handling of errors that could occur when communicating with the api. I am not sure why failed api calls, incorrect password as an example, did not return anything and a try / catch block was needed to pull out the error. In other api call assignments, the non-ok response code was returned.
- For unknown reasons, add story does not work when you try to add a story (submit navigation option > provide author, title, url > press submit) fails in Chrome, but absolutely no error is provided by axios. The failure is occurring in the
await axios.post https://hack-or-snooze-v3.herokuapp.com/stories  api call. A session refresh occurs because the console is cleared of any log messages. The amount of code to step through because of the axios call is insane. It seems there is a situation that is maybe causing an endless loop?? because the same code block seemed to get called multiple times even though there were only 4 parameters to parse.
- Getting the delete to work. The api documention was not accurate with how to format the api call for a delete.
- Trying to leverage existing functions by expanding them to work from multiple places. And trying to make new functions work in multiple situations -- standardized favorites handler that is called when favoriting from all stories, favorites, or my stories lists. 
