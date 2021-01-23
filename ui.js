$(async function () {
  // cache some selectors we'll be using quite a bit
  const $allStoriesList = $("#all-articles-list");
  const $submitForm = $("#submit-form");
  const $filteredArticles = $("#filtered-articles");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $favStories = $("#favorited-articles")
  const $ownStories = $("#my-articles");
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");

  const $navUserLinks = $("#nav-curruser");
  const $navWelcome = $("#nav-welcome");
  const $navUserProfile = $("#nav-user-profile");
  const $sectUserProfile = $("#user-profile");

  const FAV_TEXTYES = "&#9733;"; // html filled star
  const FAV_TEXTNO = "&#9734;";  // html empty star
  const FAV_CLASS = "fav-ind";
  const FAV_MSGCLASS = "fav-msg";

  const OWN_MSGCLASS = "own-msg";

  const DEL_TEXT = "&otimes;";    // html X with a circle around it
  const DEL_CLASS = "del-ind"
  const DEL_SPAN = `<span class="${DEL_CLASS}">${DEL_TEXT}</span>`;

  // global storyList variable
  let storyList = null;

  // global currentUser variable
  let currentUser = null;

  // global favorite defaults. These are set to empty star (text) and fav-ind (class)
  //  when someone logs in.
  let favText = "";
  let favClass = "";

  await checkIfLoggedIn();


  /**
   * Event listener for logging in.
   *  If successfully we will setup the user instance
   */

  $loginForm.on("submit", async function (evt) {
    evt.preventDefault(); // no page-refresh on submit

    // grab the username and password
    const username = $("#login-username").val();
    const password = $("#login-password").val();

    // call the login static method to build a user instance
    const userInstance = await User.login(username, password);
    // set the global user to the user instance
    currentUser = userInstance;

    // logged in users can see the star to mark/unmark favorites
    //setLoggedInUserGlobals();

    populateNavUserProfile();
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();

  });


  /**
   * Event listener for signing up.
   *  If successfully we will setup a new user instance
   */

  $createAccountForm.on("submit", async function (evt) {
    evt.preventDefault(); // no page refresh

    // grab the required fields
    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();

    // call the create method, which calls the API and then builds a new user instance
    const newUser = await User.create(username, password, name);
    currentUser = newUser;

    //setLoggedInUserGlobals();
    populateNavUserProfile();
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();

  });


  /**
   * Event Listener and code for Viewing User Profile / Viewing Current User
   */

  $navUserProfile.on("click", function () {

    hideSomeElements([$submitForm, $filteredArticles, $ownStories, $loginForm, $createAccountForm]);

    if (currentUser) {

      $("#profile-name").html(`<small>Name:</small> <strong>${currentUser.name}</strong>`);
      $("#profile-username").html(`<small>Username:</small> <strong>${currentUser.username}</strong>`);
      $("#profile-account-date").html(`<small>Account Created:</small> <strong>${currentUser.createdAt.substr(0, 10)}</strong>`);

      // transition from no user profile showing to displayed (username is clicked 
      //  while no user profile is displayed), use a 400ms duration for the slide.
      // transition from displayed user profile closed / no user profile display
      //  (username is clicked while displaying the user profile), immediately 
      //  slide it out without a duration.
      let duration = 0;
      if ($sectUserProfile.css("display") === "none") {
        // We have to make sure all stories is displayed. Things will get weird if it is not.
        // All stories list might have been made non-visible by another navigation option and then 
        //  the user profile option was selected.
        $allStoriesList.show();
        duration = 400;
      }

      $sectUserProfile.slideToggle(duration);
      $allStoriesList.toggle();
    }
  });


  /**
   * Log Out Functionality
   */

  $navLogOut.on("click", function () {
    // empty out local storage
    localStorage.clear();
    // refresh the page, clearing memory
    location.reload();
  });


  /**
   * Event Handler for Clicking Login
   */

  $navLogin.on("click", function () {
    // Show the Login and Create Account Forms
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    $allStoriesList.toggle();
  });


  /**
  * Event handler for clicking on submit in navigation to add a new story.
  */
  $("#nav-submit").on("click", function () {

    hideSomeElements([$filteredArticles, $favStories, $ownStories, $loginForm, $createAccountForm, $sectUserProfile]);

    // before we slide or move anything around, we need to get the ui in a steady state with regards 
    //  the main article listing. The main article list might be hidden -- this happens when the 
    //  'submit' navigation bar option is clicked while another navigation bar option ('favorites' or 
    //  'my stories') which hides the main listing was clicked. 
    // We cannot have hideSomeElements handle $allStoriesList because the flow in the click for the 
    //  submit form expects a visible allStoriesList.

    if ($submitForm.css("display") === "none") {
      // submit form has not yet been displayed. 
      // Make sure all stories list is shown
      $allStoriesList.show();
    }
    $submitForm.slideToggle();

  })


  /**
  * Event handler for clicking on 'favorites' in navigation to see favorite stories
  */
  $navUserLinks.on("click", "#nav-favorites", function () {

    hideSomeElements([$submitForm, $filteredArticles, $ownStories, $loginForm, $createAccountForm, $sectUserProfile]);

    displayArticles("#favorited-articles", FAV_MSGCLASS, `There are no articles tagged, ${FAV_TEXTYES}, as favorites.`, currentUser.favorites, FAV_TEXTYES, FAV_CLASS);

    // $("#favorited-articles").empty();

    // // Is the favorites list currently not displayed?
    // if ($("#favorited-articles").css("display") === "none") {

    //   // loop through all of the favorite stories and generate HTML for them.
    //   // FAV_TEXTYES is passed into the html generator since these are all favorites.
    //   $("#favorited-articles").empty();
    //   for (let story of currentUser.favorites) {
    //     const result = generateStoryHTML(story, FAV_TEXTYES, FAV_CLASS);
    //     $("#favorited-articles").append(result);
    //   }

    // }

    // $allStoriesList.slideToggle();
    // $("#favorited-articles").slideToggle();

  })


  /**
  * Event handler for clicking on 'my stories' in navigation to owned / submitted stories
  */
  $navUserLinks.on("click", "#nav-mystories", function () {

    hideSomeElements([$submitForm, $filteredArticles, $favStories, $loginForm, $createAccountForm, $sectUserProfile]);

    displayArticles("#my-articles", OWN_MSGCLASS, "You have not submitted any articles.",
      currentUser.ownStories, FAV_TEXTNO, FAV_CLASS, DEL_SPAN);

    if (currentUser.ownStories.length > 0) {
      // click on X to delete the article
      //const delMsg = $(`<li><strong>Click on <span>${DELTEXT}</span> to delete the article.</strong></li>`);
      $("#my-articles").prepend(`<li><h4>Click on ${DEL_TEXT} to delete the article.</h4></li>`);

      // for my stories, we need to check the list and update the star to a favorite yes when 
      //  my story is a favorite.
      setFavoriteStories(currentUser.favorites);

    }




    // $("#favorited-articles").empty();

    // // Is the favorites list currently not displayed?
    // if ($("#favorited-articles").css("display") === "none") {

    //   // loop through all of the favorite stories and generate HTML for them.
    //   // FAV_TEXTYES is passed into the html generator since these are all favorites.
    //   $("#favorited-articles").empty();
    //   for (let story of currentUser.favorites) {
    //     const result = generateStoryHTML(story, FAV_TEXTYES, FAV_CLASS);
    //     $("#favorited-articles").append(result);
    //   }

    // }

    // $allStoriesList.slideToggle();
    // $("#favorited-articles").slideToggle();

  })


  // $navUserLinks.on("click", "#nav-favorites", function () {

  //   displayArticles("#nav-favorites", currentUser.favorites, FAV_TEXTYES);

  //   // $("#favorited-articles").empty();

  //   // // Is the favorites list currently not displayed?
  //   // if ($("#favorited-articles").css("display") === "none") {

  //   //   // loop through all of the favorite stories and generate HTML for them.
  //   //   // FAV_TEXTYES is passed into the html generator since these are all favorites.
  //   //   $("#favorited-articles").empty();
  //   //   for (let story of currentUser.favorites) {
  //   //     const result = generateStoryHTML(story, FAV_TEXTYES, FAV_CLASS);
  //   //     $("#favorited-articles").append(result);
  //   //   }

  //   // }

  //   // $allStoriesList.slideToggle();
  //   // $("#favorited-articles").slideToggle();

  // })


  function displayArticles(inUIListName, inMsgClass, inMsgZero, inStoryArray, inFavText, inFavClass, inDelSpan) {

    $(inUIListName).empty();

    // Is the UI list element currently hidden?
    if ($(inUIListName).css("display") === "none") {

      // set up message area
      $(inUIListName).before(`<h4 class="${inMsgClass}">&nbsp;</h4>`);

      // loop through all of the stories in inStoryArray and generate HTML for them.
      // FAV_TEXTYES is passed into the html generator since these are all favorites.
      $(inUIListName).empty();

      // Are there any articles?
      if (inStoryArray.length > 0) {
        for (let story of inStoryArray) {
          const result = generateStoryHTML(story, inFavText, inFavClass, inDelSpan);
          $(inUIListName).append(result);
        }
      } else {
        const $noArticles = $("<h2>").html(inMsgZero);
        $(inUIListName).append($noArticles);


      }

    } else {
      // Remove the message because we are going from the displayed specialty list to hiding the list. 
      // The message h4 is built whenever we transition from no display to display.
      $(`.${inMsgClass}`).remove();
    }

    $allStoriesList.slideToggle();
    $(inUIListName).slideToggle();

  }

  /**
  * Event handler for adding a new story / submit on story add form was clicked
  */

  $submitForm.on("click", "button", async function () {

    const newStory = {
      author: $("#author").val().trim(),
      title: $("#title").val().trim(),
      url: $("#url").val().trim()
    }

    console.log("submit form event: start of click event for click of button on submit form");

    // make sure author, title, and url all have values before calling addStory
    if ((newStory.author.length > 0) && (newStory.title.length > 0) && (newStory.url.length > 5)) {
      console.log("submit form event: author, title, url all provided.");
      const addedStory = await StoryList.addStory(currentUser, newStory);

      console.log("submit form event: addedStory:");
      console.dir(addedStory);

      if (addedStory) {
        // add the story to the page.
        $allStoriesList.prepend(generateStoryHTML({
          storyId: addedStory.storyId,
          url: addedStory.url,
          title: addedStory.title,
          author: addedStory.author,
          username: addedStory.username
        }, FAV_TEXTNO, FAV_CLASS));

        $submitForm.slideToggle();

      } else {
        $("#submit-form").prepend('<h4 class="submit msg-error">An unexpected error occurred. Your story was not added.</h4>');
      }

    }

    console.log("submit form event: start of click event for click of button on submit form");

  })


  /**
   * Event handler for Navigation to Homepage
   */

  $("body").on("click", "#nav-all", async function () {
    hideElements();
    await generateStories();
    $allStoriesList.show();
  });


  /**
   * Event handler for clicking on the favorite star beside the article. 
   * Favoriting can occur from the main article list, the 'favorites' listing from 
   *  favorites in the navigation bar, or from the owned stories listing from 
   *  'my stories' in the navigation bar.
   */
  $("section.articles-container").on("click", `span.${FAV_CLASS}`, async function () {

    // a non-logged in person should not have span.fav-ind to click on since fav-ind is
    //  added once a login was successful. We will still check currentUser to ensure
    //  it exists before continuing.
    if (currentUser) {
      await handleFavoriting($(this));
      // console.log("clicked on the fav");
      // console.dir($(this));
    }
  });


  /**
   * Event handler for clicking on the delete text beside the article. 
   */
  $("section.articles-container").on("click", `span.${DEL_CLASS}`, async function () {

    // Deleting an article can only occur from the listing in 'my stories' from the 
    //  navigation bar.
    // A non-logged in person should not have a means to see 'my stories' or submitted stories
    //  since authentication is required. We will still check currentUser to ensure it exists 
    //  (that is, a logged in user) before continuing.
    if (currentUser) {

      // clear the message -- it may have one if we already deleted a story.
      //FAV_MSGCLASS
      $(`.${OWN_MSGCLASS}`).html("&nbsp;");

      const storyId = $(this).parent().attr("id");

      const delResult = await StoryList.deleteStory(currentUser, storyId);

      if (delResult) {
        console.log("delete of a story in 'my stories' was successful");
        console.dir(delResult);
        //delResult.data.story;

        // Remove the story from the my stories list.
        $(this).parent().remove();
        // Remove the story from the all stories list.
        $(`#${storyId}`).remove();

        $(`.${OWN_MSGCLASS}`).text(`'${delResult.data.story.title}' by ${delResult.data.story.author} was successfully deleted.`);


        // close my stories when the only article was deleted. only article is 
        //  determined by the list in currentUser, not the ui.

      } else {
        console.log("delete of a story in 'my stories' was NOT successful");

      }
      console.dir(delResult);
    }
  });

  // /**
  // * Event handler for Marking / Unmarking Favorites from favorites navigation option
  // */

  // $favStories.on("click", `span.${FAV_CLASS}`, async function () {

  //   await handleFavoriting($(this));

  // });

  // /**
  // * Event handler for Marking / Unmarking Favorites from main (all) storied list
  // */

  // $allStoriesList.on("click", `span.${FAV_CLASS}`, async function () {

  //   await handleFavoriting($(this));

  // });


  /**
   * Function handles the api call to add or remove a favorite story for the logged
   *  in user. The function also change the favorite text on the UI to a filled 
   *  star (FAV_TEXTYES) when the story is a favorite and to the empty star when the
   *  favorite is removed from a story.
   */
  async function handleFavoriting($inElement) {

    // Marking favorites can occur in three areas -- the main article list, the 
    //  list when 'favorites' is selected from the navigation bar, and the list
    //  when 'my favorites' is selected from the navigation bar.

    //const $inElement = $(this);

    const storyId = $inElement.parent().attr("id");

    // Using currentUser favorites instead of favorites based on ui flag.
    //if ($favSpan.hasClass(FAV_CLASS)) {
    if (User.isFavorite(currentUser.favorites, storyId)) {
      // removing favorite
      const rot = await User.favoriteDelete(currentUser, storyId);
      if (rot.status === 200) {
        // delete of favorite for current user was successful.
        //$inElement.html(FAV_TEXTNO);

        $("#" + storyId).find(`span.${FAV_CLASS}`).html(FAV_TEXTNO);

      } else {
        // Something went wrong. Is the story id still a favorite?
        if (User.isFavorite(currentUser.favorites, storyId)) {
          // the user information from the api still has the story 
          //  as a favorite. Make sure the ui reflects this, even though
          //  attempts were made to unfavorite it.
          //$inElement.html(FAV_TEXTYES);
          $("#" + storyId).find(`span.${FAV_CLASS}`).html(FAV_TEXTYES);
        } else {
          // Not sure what the error was, but the user information from
          //  the api no longer has the story as a favorite.
          //$inElement.html(FAV_TEXTNO);
          $("#" + storyId).find(`span.${FAV_CLASS}`).html(FAV_TEXTNO);
        }
      }
      console.log("in ui: remove favorites: rot=");
      console.dir(rot);

      // $inElement.html(FAV_TEXTNO);

    } else {
      // new favorite
      const rot = await User.favoriteAdd(currentUser, storyId);
      // make sure status is 200 before making ui changes.
      if (rot.status === 200) {
        console.log("in ui: add favorites: rot=");
        console.dir(rot);
        //$inElement.html(FAV_TEXTYES);
        $("#" + storyId).find(`span.${FAV_CLASS}`).html(FAV_TEXTYES);

      } else {
        //$inElement.html(FAV_TEXTNO);
        $("#" + storyId).find(`span.${FAV_CLASS}`).html(FAV_TEXTNO);
      }

    }

  };




  // /**
  //  * Event handler for Marking / Unmarking Favorites
  //  */

  // $allStoriesList.on("click", `span.${FAV_CLASS}`, async function () {

  //   const $favSpan = $(this);

  //   const storyId = $favSpan.parent().attr("id");

  //   // Using currentUser favorites instead of favorites based on ui flag.
  //   //if ($favSpan.hasClass(FAV_CLASS)) {
  //   if (User.isFavorite(currentUser.favorites, storyId)) {
  //     // removing favorite
  //     const rot = await User.favoriteDelete(currentUser, storyId);
  //     if (rot.status === 200) {
  //       // delete of favorite for current user was successful.
  //       $favSpan.html(FAV_TEXTNO);

  //     } else {
  //       // Something went wrong. Is the story id still a favorite?
  //       if (User.isFavorite(currentUser.favorites, storyId)) {
  //         // the user information from the api still has the story 
  //         //  as a favorite. Make sure the ui reflects this, even though
  //         //  attempts were made to unfavorite it.
  //         $favSpan.html(FAV_TEXTYES);
  //       } else {
  //         // Not sure what the error was, but the user information from
  //         //  the api no longer has the story as a favorite.
  //         $favSpan.html(FAV_TEXTNO);
  //       }
  //     }
  //     console.log("in ui: remove favorites: rot=");
  //     console.dir(rot);

  //     $favSpan.html(FAV_TEXTNO);

  //   } else {
  //     // new favorite
  //     const rot = await User.favoriteAdd(currentUser, storyId);
  //     // make sure status is 200 before making ui changes.
  //     if (rot.status === 200) {
  //       console.log("in ui: add favorites: rot=");
  //       console.dir(rot);
  //       $favSpan.html(FAV_TEXTYES);

  //     } else {
  //       $favSpan.html(FAV_TEXTNO);
  //     }

  //   }


  //  // hideElements();
  //  // await generateStories();
  //  // $allStoriesList.show();
  // });


  /**
   * On page load, checks local storage to see if the user is already logged in.
   * Renders page information accordingly.
   */

  async function checkIfLoggedIn() {
    // let's see if we're logged in
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    // if there is a token in localStorage, call User.getLoggedInUser
    //  to get an instance of User with the right details
    //  this is designed to run once, on page load
    currentUser = await User.getLoggedInUser(token, username);

    await generateStories();

    if (currentUser) {
      //setLoggedInUserGlobals();
      populateNavUserProfile();
      setUpLoggedInUser();

      setFavoriteStories(currentUser.favorites);
      // // check the favorite storyId(s) against the listed stories and flag the story
      // //  as a favorite when necessary.
      // // An earlier version checked whether $("#..").find(`span..`).length
      // //  was > 0 and then performed $("#..").find(`span..`).html(FAV_TEXTYES)
      // currentUser.favorites.forEach(favStory => {
      //   $("#" + favStory.storyId).find("span").html(FAV_TEXTYES);
      //   $("#" + favStory.storyId).find("span").addClass(FAV_CLASS);
      // });

    }

  }


  /**
   * Function to populate username in Navigation User Profile (nav-user-profile).
   * Call populateNavUserProfile whenever currentUser is altered.
   */

  function populateNavUserProfile() {
    $navUserProfile.html(`</small>${currentUser.username}</small>`);
  }


  /**
   * Funciton sets global variables needed in order to have favorites stars appear 
   *  besides stories in lists.
   */
  function setLoggedInUserGlobals() {

    favText = FAV_TEXTNO;
    favClass = FAV_CLASS;

  };


  /**
   * A rendering function to run to reset the forms and hide the login info
   */

  function loginAndSubmitForm() {
    // hide the forms for logging in and signing up
    $loginForm.hide();
    $createAccountForm.hide();

    // reset those forms
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");

    // show the stories
    $allStoriesList.show();

    // update the navigation bar
    setUpLoggedInUser();
  }

  /**
   * A rendering function to call the StoryList.getStories static method,
   *  which will generate a storyListInstance. Then render it.
   */

  async function generateStories() {
    // get an instance of StoryList 
    const storyListInstance = await StoryList.getStories();
    // update our global variable
    storyList = storyListInstance;
    // empty out that part of the page

    $allStoriesList.empty();

    // loop through all of our stories and generate HTML for them
    for (let story of storyList.stories) {
      //const result = generateStoryHTML(story, favText, favClass);
      const result = generateStoryHTML(story);
      $allStoriesList.append(result);
    }
  }


  /**
   * A function to render HTML for an individual Story instance
   */

  function generateStoryHTML(story, inFavText = "", inFavClass = "", inDelSpan = "") {
    let hostName = getHostName(story.url);

    // render story markup
    const storyMarkup = $(`
      <li id="${story.storyId}">
        <span class="${inFavClass}">${inFavText}</span>${inDelSpan}<a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);

    return storyMarkup;
  }


  /* hide all elements in elementsArr */

  function hideElements() {

    const elementsArr = [
      $submitForm,
      $allStoriesList,
      $filteredArticles,
      $ownStories,
      $loginForm,
      $createAccountForm
    ];
    elementsArr.forEach($elem => $elem.hide());
  }


  /* hide SOME display elements. The elements to hide are passed in as an array. */

  function hideSomeElements(inElementsArr) {
    // hideSomeElements();
    // [$submitForm, $allStoriesList, $filteredArticles, $favStories, $ownStories, $loginForm, $createAccountForm, $sectUserProfile]

    // We need to close all window elements EXCEPT the one for the option
    //  that was seleted from navigation. To handle this, when hideSome
    //  is called, only those elements that should get closed are passed in.

    inElementsArr.forEach($elem => $elem.hide());
  }


  function showNavForLoggedInUser() {
    $navLogin.hide();
    $navLogOut.show();
    $navUserLinks.show();
    $navWelcome.show();
  }

  /**
   * Function changes the empty star (FAV_TEXTNO) to the filled star (FAV_TEXTYES) for 
   * stories that are favorites.
   */
  function setFavoriteStories(inFavorites) {

    // check the favorite storyId(s) against the listed stories and flag the story
    //  as a favorite when necessary.
    // An earlier version checked whether $("#..").find(`span..`).length
    //  was > 0 and then performed $("#..").find(`span..`).html(FAV_TEXTYES)
    inFavorites.forEach(favStory => {
      $("#" + favStory.storyId).find("span").html(FAV_TEXTYES);
      $("#" + favStory.storyId).find("span").addClass(FAV_CLASS);
    });

  }


  /**
   * Show necessary navigation components for the logged in user, Setup variables, 
   * add fav-ind class and empty star to article list. Make sure the article list creation 
   * is called before this function since tince this function alters the listing by adding 
   * the favorite star.
   */
  function setUpLoggedInUser() {

    // set up global values for favText and favClass
    favText = FAV_TEXTNO;
    favClass = FAV_CLASS;

    showNavForLoggedInUser();

    // We have a story list. set the star and add the class so we can select
    //  the story for favoriting.
    $allStoriesList.find("span").html(FAV_TEXTNO);
    $allStoriesList.find("span").removeClass();
    $allStoriesList.find("span").addClass(FAV_CLASS);

  }

  /* simple function to pull the hostname from a URL */

  function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }

  /* sync current user information to localStorage */

  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
    }
  }
});

function testFilter(inUserStories, inStoryId) {

  inUserStories = inUserStories.filter(story => story.storyId !== inStoryId);

  let ctr = 0;

}