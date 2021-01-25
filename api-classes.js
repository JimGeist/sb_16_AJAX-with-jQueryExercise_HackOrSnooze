const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/**
 * This class maintains the list of individual Story instances
 *  It also has some methods for fetching, adding, and removing stories
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /**
   * This method is designed to be called to generate a new StoryList.
   *  It:
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.*
   */

  // TODO: Note the presence of `static` keyword: this indicates that getStories
  // is **not** an instance method. Rather, it is a method that is called on the
  // class directly. Why doesn't it make sense for getStories to be an instance method?

  static async getStories() {
    // query the /stories endpoint (no auth required)
    const response = await axios.get(`${BASE_URL}/stories`);

    // turn the plain old story objects from the API into instances of the Story class
    const stories = response.data.stories.map(story => new Story(story));

    // build an instance of our own class using the new array of stories
    const storyList = new StoryList(stories);
    return storyList;
  }


  /**
   * Method to make a POST request to /stories and add the new story to the list
   * - inUser - the current instance of User who will post the story
   * - newStory - a new story object for the API with title, author, and url
   *
   * Returns the new story object
   */

  static async addStory(inUser, inNewStory) {
    // TODO - Implement this functions!
    // this function should return the newly created story so it can be used in
    // the script.js file where it will be appended to the DOM

    try {

      const response = await axios.post(`${BASE_URL}/stories`, {
        token: inUser.loginToken,
        story: {
          author: inNewStory.author,
          title: inNewStory.title,
          url: inNewStory.url
        }

      });

      console.dir(response);

      if (response.status === 201) {
        // The story was inserted by the user. We need to update the inUser object 
        //  ownStories with the story details return by the api.
        inUser.ownStories.push(new Story(response.data.story));
        return response.data.story;
      }

    } catch (error) {
      console.log("an error occurred");
      console.dir(error);
    }


  };


  static async deleteStory(inUser, inStoryId) {

    const response = await axios.delete(`${BASE_URL}/stories/${inStoryId}`, {
      headers: {
        Authorization: "token"
      },
      data: {
        token: inUser.loginToken
      }
    });

    if (response.status === 200) {

      // the story was deleted. We need to update inUser's ownStories by 
      //  removing the story that was just deleted.
      const newOwnStories = inUser.ownStories.filter(story => story.storyId !== inStoryId);
      inUser.ownStories = newOwnStories;

      return response;

    }

  }

}


/**
 * The User class to primarily represent the current user.
 *  There are helper methods to signup (create), login, and getLoggedInUser
 */

class User {
  constructor(userObj) {
    this.username = userObj.username;
    this.name = userObj.name;
    this.createdAt = userObj.createdAt;
    this.updatedAt = userObj.updatedAt;

    // these are all set to defaults, not passed in by the constructor
    this.loginToken = "";
    this.favorites = [];
    this.ownStories = [];
  }

  /* Create and return a new user.
   *
   * Makes POST request to API and returns newly-created user.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async create(username, password, name) {
    const response = await axios.post(`${BASE_URL}/signup`, {
      user: {
        username,
        password,
        name
      }
    });

    // build a new User instance from the API response
    const newUser = new User(response.data.user);

    // attach the token to the newUser instance for convenience
    newUser.loginToken = response.data.token;

    return newUser;
  }

  /* Login in user and return user instance.

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {

    let response;

    try {

      response = await axios.post(`${BASE_URL}/login`, {
        user: {
          username,
          password
        }
      });

    } catch (error) {
      // return the error components for display in the ui.
      return {
        error: error.response.data.error.title,
        errMsg: error.response.data.error.message
      }
    }

    // build a new User instance from the API response
    const existingUser = new User(response.data.user);

    // instantiate Story instances for the user's favorites and ownStories
    existingUser.favorites = response.data.user.favorites.map(s => new Story(s));
    existingUser.ownStories = response.data.user.stories.map(s => new Story(s));

    // attach the token to the newUser instance for convenience
    existingUser.loginToken = response.data.token;

    return existingUser;
  }

  /** Get user instance for the logged-in-user.
   *
   * This function uses the token & username to make an API request to get details
   *   about the user. Then it creates an instance of user with that info.
   */

  static async getLoggedInUser(token, username) {
    // if we don't have user info, return null
    if (!token || !username) return null;

    // call the API
    const response = await axios.get(`${BASE_URL}/users/${username}`, {
      params: {
        token
      }
    });

    // instantiate the user from the API information
    const existingUser = new User(response.data.user);

    // attach the token to the newUser instance for convenience
    existingUser.loginToken = token;

    // instantiate Story instances for the user's favorites and ownStories
    existingUser.favorites = response.data.user.favorites.map(s => new Story(s));
    existingUser.ownStories = response.data.user.stories.map(s => new Story(s));
    return existingUser;

  }


  /** Add a story to the logged-in user's favorite list
   * 
   * This function uses the logged-in user's username and authorization token to add the 
   *  story id to the user's favorites. The existing instance of the user object is updated 
   *  with the current list of favorites. 
   *
   */
  static async favoriteAdd(inCurrUser, inStoryId) {

    const response = await axios.post(`${BASE_URL}/users/${inCurrUser.username}/favorites/${inStoryId}`, {
      token: inCurrUser.loginToken
    });

    inCurrUser.favorites = response.data.user.favorites.map(s => new Story(s));

    // return the entire response object. The plan was to have the ui javascript check the status 
    //  code and take appropriate action on whether the story was added as a favorite, but it seems 
    //  if anything goes wrong, the error is intercepted by axios and this function never 
    //  sees the non-200 response code.
    return response;

  }


  /** Delete a story to the logged-in user's favorite list
   * 
   * This function uses the logged-in user's username and authorization token to delete the 
   *  story id from the user's favorites. The existing instance of the user object is updated 
   *  with the current list of favorites. 
   *
   */
  static async favoriteDelete(inCurrUser, inStoryId) {

    const response = await axios.delete(`${BASE_URL}/users/${inCurrUser.username}/favorites/${inStoryId}`, {
      headers: {
        Authorization: "token"
      },
      data: {
        token: inCurrUser.loginToken
      }
    });

    inCurrUser.favorites = response.data.user.favorites.map(s => new Story(s));

    // return the entire response object. 
    return response;

  }


  /** Checks whether a story exists in the 'favorites' list.
   * 
   * This function checks the storyId against the passed in story list. The function was written 
   *  as a means to check for favorites, but instead of locking it into the favorites array on 
   *  the user object, it instead uses the parameter array -- which could also be the user owned 
   *  stories. 
   * The function returns 
   *  true when the story id was found in the array and 
   *  false when the story id was not found in the array.
   *
   */
  static isFavorite(inFavStories, inStoryId) {

    // inFavStories is an array of story objects. We need to check whether 
    //  inStoryId is a storyId for one of the favorite stories.

    const foundStory = inFavStories.some(currStory =>
      currStory.storyId === inStoryId
    )

    return foundStory;

  }

}


/**
 * Class to represent a single story.
 */

class Story {

  /**
   * The constructor is designed to take an object for better readability / flexibility
   * - storyObj: an object that has story properties in it
   */

  constructor(storyObj) {
    this.author = storyObj.author;
    this.title = storyObj.title;
    this.url = storyObj.url;
    this.username = storyObj.username;
    this.storyId = storyObj.storyId;
    this.createdAt = storyObj.createdAt;
    this.updatedAt = storyObj.updatedAt;
  }
}