
import Search from './models/Search';
import Reciple from './models/Recipe';
import List from './models/List';
import * as searchView from './views/searchView';
import {clearLoader, elements, renderLoader} from './views/base';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import Recipe from './models/Recipe';
import Likes from './models/Likes';



/** 
 * Global state of the app
 * - Search object
 * - Current recipe object
 * - Shopping list object
 * - Liked recipes
 * 
 */
const state = {};

/**SEARCH CONTROLLER
 * 
 */

const controlSearch = async () => {
    //get query from view
    const query = searchView.getInput();//TODO
    

    
    if(query){
        // New Search object and add it to state
        state.search = new Search(query);

        //Prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);
    

        //Search for recipes
        try {
            await  state.search.getResults();

            // Render results on UI
            clearLoader();
            searchView.renderResults(state.search.result);
        } catch(error){
            alert(`We cant find shit`);
            clearLoader();
 
        }
       
    }

    }

elements.searchForm.addEventListener('submit', e => {
        e.preventDefault();
        controlSearch();
     })
   
elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline')
    if(btn){
    const goToPage = parseInt(btn.dataset.goto, 10);
    searchView.clearResults();
    searchView.renderResults(state.search.result, goToPage);

    
}
});

/**RECIPE CONTROLLER
 * 
 */
/* const r = new Recipe(36453);

r.getRecipe();
console.log(r); */

const controlRecipe = async () => {
    const id = window.location.hash.replace('#', '');
    

    if(id){
        //Prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        //Hightlight selected search item
        if(state.search){
            searchView.highlightedSelected(id);
        }
        //Create new recipe object
        state.recipe = new Recipe(id);

        try { 
            //Get recipe data and parse Ingredients
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();

            //Calculate serving and time
            state.recipe.calcServings();
            state.recipe.calcTime();

            //Render recipe
             clearLoader();
             recipeView.renderRecipe(
                 state.recipe,
                 state.likes.isLiked(id)
                 );
        }catch (error) {
            console.log(error);
            alert('Error processing recipe');
        }
        
    }
};

 


// window.addEventListener('hashchange', controlRecipe);
// window.addEventListener('load', controlRecipe);

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));



/** 
* LIST CONTROLLER
*/ 

  
const controlList = () => {
    //Create a new List If there is none yet
    if(!state.List)state.list = new List(); 


    //Add each ingredient to the list and user Interface
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);

        listView.renderItem(item);
    });

};

//Handle delete and update list item events
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    //Handle the delete button
    if (e.target.matches('.shopping__delete, .shopping__delete *')) {
        //Delete from state
        state.list.deleteItem(id);
        //Delete from UI
        listView.deleteItem(id);

        //Handle the account update
    }else if (e.target.matches('.shopping__count-value')){
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
});

/**
 * LIKE CONTROLLER
 */


const controlLike = () =>{
    if(!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;
    
    //User has not yet liked current recipe
    if(!state.likes.isLiked(currentID)) {
        //Add like to the state
        const newLike = state.likes.addLike(
            currentID, 
            state.recipe.title,
            state.recipe.author, 
            state.recipe.img
        );
        //Toggle the like button
        likesView.toggleLikeBtn(true);

        //Add like to UI List
        likesView.renderLike(newLike);
        
        //user HAS liked the current recipe
    }else {
        //remove like from the state
        state.likes.deleteLike(currentID);

        //Toggle the like button
        likesView.toggleLikeBtn(false);

        //Remove like from the UI List
        likesView.deleteLike(currentID);
        
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
};


//Restore Liked recipes on page load
window.addEventListener('load', () => {
    state.likes = new Likes();

    //Restore Likes
    state.likes.readStorage();

    //Toggle like menu button
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    //Render the existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));

});




//Handling Recipe Button clicks
elements.recipe.addEventListener('click', e => {
    if(e.target.matches('.btn-decrease, .btn-decrease *')){
        //Decrease button is clicked
        if(state.recipe.servings > 1){
        state.recipe.updateServings('dec');
        recipeView.updateServingsIngredients(state.recipe);
        } 
    }else if(e.target.matches('.btn-increase, .btn-increase *')){
        //increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    }else if (e.target.matches('.recipe__btn-add, .recipe__btn-add *')) {
        //Add ingredients to shopping List
        controlList();
    }else if (e.target.matches('.recipe__love, .recipe__love *')) {
        //Like controller
        controlLike();
    }

});
 