const router = require('express').Router();
const { Category, Product } = require('../../models');

// The `/api/categories` endpoint

router.get('/', (req, res) => {
  Category.findall({
    include: [Product]
  })
    .then(dbCategoryData => res.json(dbCategoryData))
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
});

  // find all categories
router.get('/:id', (req, res) => {  
  Category.findOne({
    where: {
      id: req.params.id
    },
    include: [Product]
  })
    .then(dbCategoryData => {
      if (!dbCategoryData) {
        res.status(404).json({ message: 'No category found with this id' });
        return;
      }
      res.json(dbCategoryData);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
});


  // create a new category 
router.post('/', (req, res) => {
  Category.create(req.body)
    .then((category) => {
      // if there's product tags, we need to create pairings to bulk create in the join table
      if (req.body.products) {
        const productTagIds = req.body.products.map(product => {
          return { product_id: product.id, tag_id: product.tagId };
        });
        // hit the ProductTag model for each pairing, then turn them into an array and pass it on the data property of our separate db Category data.
        // insert them into the join table
        return ProductTag.bulkCreate(productTagIds, { individualHooks: true });
      }
      else {
        res.status(201).json(category);
      }
    })
    .then((createdProductTags) => res.status(201).json(createdProductTags))
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
});


// update a category by its `id` value 
router.put('/:id', (req, res) => {
    Category.update(req.body, {
    where: {
      id: req.params.id
    }
  ,
  // ASSOCIATIONS
  {
    // making sure that the Tags are properly updated with the correct foreign ids for products
    // through the ProductTag model
    include: [Product]
  }
  )
    .then((updatedCategory) => {
      // If no category was found, send a 404
      if (!updatedCategory[0]) {
        res.status(404).json({ message: 'No category with this id!' });
        return;
      }
      // Sending back the updated category
      res.status(200).json(updatedCategory);
    })
    .catch((err) => {
      //console.error(err);
      res.status(500).json(err);
    });
});


 // delete a category by its `id` value
router.delete('/:id', (req, res) => {
  Category.destroy({
    where: {
      id: req.params.id
    }
  }).then((numDeleted) => {
    // If no category was deleted, then a 404 was returned
    if(!numDeleted){
      res.status(404).json({message: "No category with this id!"})
      return;
    }
    // Returning a success message upon deletion
    res.status(200).json({message:"Successfully deleted category"})
  }).catch((err)=>{
    console.log(err);
    res.status(500).json(err);
  });
});

module.exports = router;
