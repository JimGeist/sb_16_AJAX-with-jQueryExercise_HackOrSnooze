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

  const IDPREFIX_FAV = "--fav--"; // prefix for Story Id in favorites list
  const IDPREFIX_OWN = "--own--"; // prefix for Story Id in my stories list

  const FAV_TEXTYES = "&#9733;";  // html filled star
  const FAV_TEXTNO = "&#9734;";   // html empty star
  const FAV_CLASS = "fav-ind";    // class aids in jQuery selection and has css formatting attached
  const FAV_MSGCLASS = "fav-msg"; // class aids in jQuery selection has css formats attached

  const OWN_MSGCLASS = "own-msg"; // class aids in jQuery selection has css formats attached

  const DEL_TEXT = "&otimes;";    // html X with a circle around it
  const DEL_CLASS = "del-ind"     // class aids in jQuery selection and has css formatting attached
  const DEL_SPAN = `<span class="${DEL_CLASS}">${DEL_TEXT}</span>`;

  // global storyList variable
  let storyList = null;

  // global currentUser variable
  let currentUser = null;

  await checkIfLoggedIn();


  /**
   * Event listener for logging in.
   *  If successfully we will setup the user instance
   */

  $loginForm.on("submit", async function (evt) {
    evt.preventDefault(); // no page-refresh on submit

    if ($(".loginmsg").length > 0) {
      // clear the login message if it already exists on the form. 
      // nbsp used so screen does not dance as the h4 element collapses because of no value
      $(".loginmsg").html("&nbsp;");
    }
    // grab the username and password
    const username = $("#login-username").val();
    const password = $("#login-password").val();

    // call the login static method to build a user instance
    const userInstance = await User.login(username, password);

    if (userInstance.username) {

      // set the global user to the user instance
      currentUser = userInstance;

      populateNavUserProfile();
      syncCurrentUserToLocalStorage();
      loginAndSubmitForm();

    } else {

      // An error occurred. We know this because if (userInstance.username)
      //  tested as falsey and here we are.
      const loginError = `${userInstance.error}: ${userInstance.errMsg}`;
      if ($(".loginmsg").length === 0) {
        // create the message element and populate it with the error message.
        $loginForm.prepend(`<h4 class="loginmsg msg-error">${loginError}</h4>`);
      } else {
        // message already exists, just update it
        $(".loginmsg").text(loginError);
      }

    }

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

    populateNavUserProfile();
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();

  });


  /**
   * Event Listener and code for Viewing User Profile / Viewing Current User
   */

  $navUserProfile.on("click", function () {

    hideSomeElements([$submitForm, $filteredArticles, $favStories, $ownStories, $loginForm, $createAccountForm]);

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
        // All stories list might have been made non-visible by another opened navigation option and then 
        //  the user profile option was selected while the other option was still opened.
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

    // delete the message element. It gets created if an error occurs while handling 
    //  the submission of the login form 
    $(".loginmsg").remove();
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

    // displayArticles is a generic code block to process a list of articles on the user object. It gets a bit 
    //  crazy parameter-wise because generateStoryHTML is also reused for 3 list purposes, and we need to pass 
    //  values into displayArticles that are solely needed by generateStoryHTML. 
    displayArticles($favStories, FAV_MSGCLASS, `There are no favorite articles tagged with a ${FAV_TEXTYES}.`,
      currentUser.favorites, FAV_TEXTYES, `${FAV_CLASS} ${IDPREFIX_FAV}`, IDPREFIX_FAV);

  })


  /**
  * Event handler for clicking on 'my stories' in navigation to owned / submitted stories
  */
  $navUserLinks.on("click", "#nav-mystories", function () {

    hideSomeElements([$submitForm, $filteredArticles, $favStories, $loginForm, $createAccountForm, $sectUserProfile]);

    displayArticles($ownStories, OWN_MSGCLASS, "You have not submitted any articles.",
      currentUser.ownStories, FAV_TEXTNO, `${FAV_CLASS} ${IDPREFIX_OWN}`, IDPREFIX_OWN, DEL_SPAN);

    // my stories differs from favorites because we not only need the delete span in the list, but we also need to 
    //  determine whether any of the articles in the owned stories list are favorites. All the craziness of id
    //  prefixes comes into play here because without the prefix on the id, we would change the favorite indicator 
    //  in the all stories list NOT the one in the my stories. 
    if (currentUser.ownStories.length > 0) {
      // Add an informational message to click on X to delete the article
      $("#my-articles").prepend(`<li><h4>Click on ${DEL_TEXT} to the left of the article to delete the article.</h4></li>`);

      // move the h4 with class inMsgClass that was created in displayArticles to the end of the list
      const $h4Msg = $(`h4.${OWN_MSGCLASS}`).detach();
      $("#my-articles").append($h4Msg);

      // for my stories, we need to check the list and update the star to a favorite yes when 
      //  my story is a favorite.
      setFavoriteStories(currentUser.favorites, `span.${IDPREFIX_OWN}`, IDPREFIX_OWN);

    }

  })


  /** displayArticles is a generic code block to process a list of articles on the user object. It gets a bit 
   *  crazy parameter-wise because generateStoryHTML is also reused for 3 list purposes, and we need to pass 
   *  values into displayArticles that are solely needed by generateStoryHTML.
   *
   *   $inUIListName - ui list element (either $favStories or $ownStories) that will hold the stories 
   *   inMsgClass - the class to attach to the messaging h4 created within displayArticles to display 
   *      helpful messages. It is used to select the h4 element.
   *   inMsgZero - the helpful message to display when there are no stories. inMsgClass is used to select 
   *      the messsage element. 
   *   inStoryArray - the array of stories we need to list in $inUIListName.
   * The following 4 parameters are required for the call to generateStoryHTML
   *   inFavText - the text to show for favorites and non-favorite articles. When building the favorite list,
   *      inFavText is the solid-filled star -- since everything on the list is a favorite. For the owned 
   *      stories list, it is the empty star because a process later determines whether an owned article 
   *      is also a favorite.
   *   inFavClass - the class to include in the span, regardless of whether the article is a favorite or not. 
   *      inFavClass aids in selection of articles as well as formatting via css.
   *   inIdPrefix - seems that selecting by id only returns the first instance of that id. A story in the 
   *      favorite list will have the same id as a story in the article list. But if we use the story id 
   *      to manipulate the story display, the article list story is encountered first (same issue exists
   *      with owned stories). The story id for articles in the favorite story list have a --fav-- prefix 
   *      on the story id (stories in the my stories list have --own-- as a story id prefix.)
   *   inDelSpan - the owned story list has the ability to delete the article. We need to pass in the html 
   *      for the span so the delete works. inDelSpan defaults to "" if a value was not passed.
   * 
   */
  function displayArticles($inUIListName, inMsgClass, inMsgZero, inStoryArray, inFavText, inFavClass, inIdPrefix, inDelSpan = "") {

    $inUIListName.empty();

    // Is the UI list element currently hidden?
    if ($inUIListName.css("display") === "none") {

      // inUIListName view ('favorites' or 'my stories') option selected from Navigation bar AND the
      //  list component is currently not visible. 
      // Make sure the all stories list is visible. 
      $allStoriesList.show();

      $inUIListName.empty();

      // set up message area
      $inUIListName.append(`<h4 class="${inMsgClass}">&nbsp;</h4>`);

      // Are there any articles?
      if (inStoryArray.length > 0) {
        // loop through all of the stories in inStoryArray and generate HTML for them.
        // when called from favorites, inFavText is FAV_TEXTYES because we know all the stories the 
        //  story array are favorites.
        // when called from my stories, inFavText is FAV_TEXTNO because we just need the list built
        //  and we check whether any of the owned stories are favorites upon return from displayArticles.
        for (let story of inStoryArray) {
          const result = generateStoryHTML(story, inFavText, inFavClass, inIdPrefix, inDelSpan);
          $inUIListName.append(result);
        }
      } else {
        // Stuff the inMsgZero message into the element selected via inMsgClass. This element is created 
        //  above. It is also within inUtilListName and will get removed when the list is emptied.
        $(`.${inMsgClass}`).html(inMsgZero);
      }

    }

    $allStoriesList.slideToggle();
    $inUIListName.slideToggle();

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

    // make sure author, title, and url all have values before calling addStory. The fields are 
    //  required on the ui, but what if that should fail?
    if ((newStory.author.length > 0) && (newStory.title.length > 0) && (newStory.url.length > 5)) {

      const addedStory = await StoryList.addStory(currentUser, newStory);

      // addStory is within a try / catch block in api-classes.js so we will end up here even if the 
      //  catch block executed.
      if (addedStory) {
        // add the story to the page.
        $allStoriesList.prepend(generateStoryHTML({
          storyId: addedStory.storyId,
          url: addedStory.url,
          title: addedStory.title,
          author: addedStory.author,
          username: addedStory.username
        }, FAV_TEXTNO, FAV_CLASS));

        // Clear the inputs submit-form (article submission) inputs
        $("#author").val("");
        $("#title").val("");
        $("#url").val("");

        $submitForm.slideToggle();

      } else {
        $("#submit-form").prepend('<h4 class="submit msg-error">An unexpected error occurred. Your story was not added.</h4>');
      }

    }

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
    }
  });


  /**
   * Event handler for clicking on the delete text beside the article. 
   */
  $("section.articles-container").on("click", `span.${DEL_CLASS}`, async function () {

    // Deleting an article can only occur from the listing in 'my stories' from the 
    //  navigation bar. The span with the DEL_CLASS class is included in the article list 
    //  when the list is build from the my stories list.
    // A non-logged in person should not have a means to see 'my stories' or submitted stories
    //  since authentication is required. We will still check currentUser to ensure it exists 
    //  (that is, a logged in user) before continuing.
    if (currentUser) {

      // clear the message -- it may have one if we already deleted a story. html is used because
      //  &nbsp; is used as a value for no message so the space never collapses when there is no 
      //  text.
      $(`.${OWN_MSGCLASS}`).html("&nbsp;");

      // uiStoryId has the --own-- prefix, storyId does not.
      // storyId is used when deleting the story from the all stories list.
      const uiStoryId = $(this).parent().attr("id");
      const storyId = uiStoryId.replace(IDPREFIX_OWN, "");

      const delResult = await StoryList.deleteStory(currentUser, storyId);

      if (delResult) {

        // Remove the story from the my stories list.
        $(this).parent().remove();
        // Remove the story from the all stories list.
        $(`#${storyId}`).remove();

        // handy-dandy delete successful message. YOU NEED TO KEEP THE USER INFORMED.
        $(`.${OWN_MSGCLASS}`).text(`'${delResult.data.story.title}' by ${delResult.data.story.author} was successfully deleted.`);

      } else {
        console.log("delete of a story in 'my stories' was NOT successful");

      }
      console.dir(delResult);
    }
  });


  /**
   * Function handles the api call to add or remove a favorite story for the logged
   *  in user. The function also changeS the favorite text on the UI to a filled 
   *  star (FAV_TEXTYES) when the story is a favorite and to the empty star when the
   *  favorite is removed from a story.
   */
  async function handleFavoriting($inElement) {

    // Marking favorites can occur in three areas -- the all articles list, the 
    //  list when 'favorites' is selected from the navigation bar, and the list
    //  when 'my stories' is selected from the navigation bar.

    const uiStoryId = $inElement.parent().attr("id");

    // strip out any special id prefix added to make the id unique in favorite
    //  or own windows.
    let storyId = uiStoryId.replace(IDPREFIX_FAV, "");
    storyId = storyId.replace(IDPREFIX_OWN, "");

    // Using currentUser favorites instead of favorites based on ui flag.
    if (User.isFavorite(currentUser.favorites, storyId)) {
      // remove favorite
      const rot = await User.favoriteDelete(currentUser, storyId);
      if (rot.status === 200) {
        // delete of favorite for current user was successful.
        // change the html for the article to an empty star (FAV_TEXTNO)
        $("#" + storyId).find(`span.${FAV_CLASS}`).html(FAV_TEXTNO);

        // call the list handler to take care of the favorite displayed 
        //  displayed 'favorite' or displayed 'my stories' list.
        handleFavOrOwnLists(uiStoryId, FAV_TEXTNO);

      } else {
        // Something went wrong. Is the story id still a favorite?
        if (User.isFavorite(currentUser.favorites, storyId)) {
          // the user information from the api still has the story 
          //  as a favorite. Make sure the ui reflects this, even though
          //  attempts were made to unfavorite it.
          $("#" + storyId).find(`span.${FAV_CLASS}`).html(FAV_TEXTYES);
        } else {
          // Not sure what the error was, but the user information from
          //  the api no longer has the story as a favorite.
          $("#" + storyId).find(`span.${FAV_CLASS}`).html(FAV_TEXTNO);
        }
      }

    } else {
      // new favorite
      const rot = await User.favoriteAdd(currentUser, storyId);
      // make sure status is 200 before making ui changes.

      if (rot.status === 200) {
        // Story was successfully added as a favorite for the user. 
        // Update the UI all articles list
        $("#" + storyId).find(`span.${FAV_CLASS}`).html(FAV_TEXTYES);

        // We need to handle the favorite text on the favorites or the 
        //  my stories listings.
        handleFavOrOwnLists(uiStoryId, FAV_TEXTYES);

      } else {
        // Kind of rendundant since the favorite text should already be
        //  textno.
        $("#" + storyId).find(`span.${FAV_CLASS}`).html(FAV_TEXTNO);
      }

    }

  };


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
      populateNavUserProfile();

      // for logged in users, we need to 
      // - show the submit, favorites, my stories options in the navigation bar 
      // - we need to adjust the story list by adding and setting the 
      //    favorite indicator
      // We need to do this in one other place too, so a function was created 
      //  to handle the setup.
      setUpLoggedInUser();

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

    // for logged in users, we need to 
    // - show the submit, favorites, my stories options in the navigation bar 
    // - we need to adjust the story list by adding and setting the 
    //    favorite indicator
    // We need to do this in multiple places too, so a function was created 
    //  to handle the setup.
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
      const result = generateStoryHTML(story);
      $allStoriesList.append(result);
    }
  }


  /** 
   * Function handles the display of favorites in the favorites or the my stories
   *  lists. A generic function handles the grunt work of facilitating the api calls to 
   *  update favorites and the related updates to the all stories list, but favorites 
   *  that are unfavorited are removed from the favorites list while they are unmarked 
   *  in the my stories list.
   */
  function handleFavOrOwnLists(inStoryId, inFavText) {

    if (($favStories.css("display") === "none") && ($ownStories.css("display") === "none")) {
      return
    }

    if ($favStories.css("display") !== "none") {
      // the favorites window is displayed.
      // the favorite is no longer a favorite and should be removed from the list.
      $(`#${inStoryId}`).remove();

      if ($(`.${IDPREFIX_FAV}`).length === 0) {
        // all favorites have been unfavorited.
        $(`.${FAV_MSGCLASS}`).text("You have unfavorited all your favorites!!");
      }
    } else if ($ownStories.css("display") !== "none") {

      $("#" + inStoryId).find(`span.${IDPREFIX_OWN}`).html(inFavText);

    }

  };


  /**
   * A function to render HTML for an individual Story instance.
   * This render function is called for the all stories list, the all stories list when someone 
   *  is logged in, the favorites list, and the my stories list.
   * story - the object with the author, story id, title, url, and posting user.
   * inFavText - for all stories list, favorites list, and my stories list (all of which require a
   *   logged in user), inFavText holds the text to show whether the story is a favorite. Value is
   *   "" for all list when no user is logged in.
   * inFavClass - for all stories list, favorites list, and my stories list (all of which require a
   *   logged in user), inFavClass holds class name used to detect whether the story was clicked on 
   *   to add or remove the favorite. The class also has css display controls attached. Value is
   *   "" for class when no user is logged in.
   * inIdPrefix - story ids in the favorites and my stories list need a prefix added to aid in 
   *   selecting the story from the favorite or my stories list, depending on which is currently 
   *   active. Without the prefix, selection based on story id will only affect the story on the 
   *   all story list -- since the all stories list appears before favorites, filtered, or my 
   *   stories list. Value is "" for prefix when no user is logged in or for when generateStoryHTML 
   *   is called from generateStories to build the all stories list.
   * inDelSpan - the complete span element to insert into the html to make the story selectable for 
   *   delete from the my stories list. Value is only provided when the list is built for the 
   *   my stories list and defaults to "" for all other cases.
   */

  function generateStoryHTML(story, inFavText = "", inFavClass = "", inIdPrefix = "", inDelSpan = "") {
    let hostName = getHostName(story.url);

    // render story markup
    const storyMarkup = $(`
      <li id="${inIdPrefix}${story.storyId}">
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
  function setFavoriteStories(inFavorites, inFindWhat, inIdPrefix) {

    // check the favorite storyId(s) against the listed stories and flag the story
    //  as a favorite when necessary.
    // An earlier version checked whether $("#..").find(`span..`).length
    //  was > 0 and then performed $("#..").find(`span..`).html(FAV_TEXTYES)
    inFavorites.forEach(favStory => {
      // $("#" + favStory.storyId).find("span").html(FAV_TEXTYES);
      // $("#" + favStory.storyId).find("span").addClass(FAV_CLASS);
      $(`#${inIdPrefix}${favStory.storyId}`).find(inFindWhat).html(FAV_TEXTYES);
      $(`#${inIdPrefix}${favStory.storyId}`).find(inFindWhat).addClass(FAV_CLASS);
    });

  }


  /**
   * Show necessary navigation components for the logged in user, Setup variables, 
   * add fav-ind class and empty star to article list. Make sure the article list creation 
   * is called before this function since tince this function alters the listing by adding 
   * the favorite star.
   */
  function setUpLoggedInUser() {

    showNavForLoggedInUser();

    // We have a story list. set the star and add the class so we can select
    //  the story for favoriting.
    $allStoriesList.find("span").html(FAV_TEXTNO);
    $allStoriesList.find("span").removeClass();
    $allStoriesList.find("span").addClass(FAV_CLASS);

    // set favorite text if any in list are a favorite.
    setFavoriteStories(currentUser.favorites, "span", "");

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
