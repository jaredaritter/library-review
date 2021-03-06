const Genre = require('../models/genre');
const Book = require('../models/book');

const async = require('async');
const { body, validationResult } = require('express-validator');

// Display list of all Genre.
exports.genre_list = function (req, res, next) {
  Genre.find()
    .sort([['name', 'ascending']])
    .exec(function (err, list_genres) {
      if (err) {
        return next(err);
      }
      res.render('genre_list', {
        title: 'Genre List',
        genre_list: list_genres,
      });
    });
};

// Display detail page for a specific Genre.
exports.genre_detail = function (req, res, next) {
  // USE GENRE ID AS PARAMETER
  // DISPLAY NAMES AND SUMMARIES OF ALL BOOKS IN THE GENRE
  async.parallel(
    {
      genre: function (callback) {
        Genre.findById(req.params.id).exec(callback);
      },
      genre_books: function (callback) {
        Book.find({ genre: req.params.id }).exec(callback);
      },
    },
    function (err, results) {
      // IF ASYNC ERROR ALLOW ERROR CHAIN TO HANDLE
      if (err) {
        return next(err);
      }
      // IF GENRE NOT FOUND SEND SPECIFIC ERROR DOWN CHAIN
      if (results.genre === null) {
        const err = new Error('Genre not found');
        err.status = 404;
        return next(err);
      }
      // IF SUCCESSFUL
      res.render('genre_detail', {
        title: 'Genre Detail',
        genre: results.genre,
        genre_books: results.genre_books,
      });
    }
  );
};

// Display Genre create form on GET.
exports.genre_create_get = function (req, res, next) {
  Genre.find()
    .sort([['name', 'ascending']])
    .exec(function (err, list_genres) {
      if (err) {
        return next(err);
      }
      res.render('genre_form', {
        title: 'Create Genre',
        genre_list: list_genres,
      });
    });
};

exports.genre_create_post = [
  // VALIDATE AND SANITIZE
  // MESSAGE APPIES TO VALIDATOR ISLENGTH
  body('name', 'Genre name required.').trim().isLength({ min: 1 }).escape(),

  // PROCESS VALIDATED AND SANITIZED REQUEST
  (req, res, next) => {
    // SAVE VALIDATION ERRORS FROM THE REQUEST
    const errors = validationResult(req);

    // CREATE NEW GENRE OBJECT (ALLOWS FOR EASY USE OF MODEL SAVE METHOD LATER ON TO STORE IN DB)
    const genre = new Genre({
      name: req.body.name,
    });

    // IF VALIDATION ERRORS, RENDER FORM AGAIN WITH SANITIZED VALUES AND ERROR MESSAGE.
    if (!errors.isEmpty()) {
      Genre.find()
        .sort([['name', 'ascending']])
        .exec(function (err, list_genres) {
          if (err) {
            return next(err);
          }
          res.render('genre_form', {
            title: 'Create Genre',
            genre_list: list_genres,
            genre: genre,
            errors: errors.array(),
          });
        });
    }

    // IF DATA IS VALID CONTINUE
    else {
      // CHECK IF GENRE NAME ALREADY PRESENT IN DB
      Genre.findOne({ name: req.body.name }).exec(function (err, found_genre) {
        // IF OTHER ERROR, SEND DOWN CHAIN
        if (err) {
          return next(err);
        }
        // IF GENRE ALREADY PRESENT, REDIRECT TO THAT DETAIL PAGE
        if (found_genre) {
          res.redirect(found_genre.url);
        }
        // IF DATA IS VALID AND NAME NOT PRESENT SAVE TO DB AND REDIRECT TO ITS DETAIL PAGE
        else {
          genre.save(function (err) {
            if (err) {
              return next(err);
            }
            res.redirect(genre.url);
          });
        }
      });
    }
  },
];

// Display Genre delete form on GET.
exports.genre_delete_get = function (req, res, next) {
  async.parallel(
    {
      genre: function (callback) {
        Genre.findById(req.params.id).exec(callback);
      },
      genre_books: function (callback) {
        Book.find({ genre: req.params.id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.genre === null) {
        res.redirect('/catalog/authors');
      }
      res.render('genre_delete', {
        title: 'Delete Genre',
        genre: results.genre,
        genre_books: results.genre_books,
      });
    }
  );
};

// Handle Genre delete on POST.
exports.genre_delete_post = function (req, res, next) {
  async.parallel(
    {
      genre: function (callback) {
        Genre.findById(req.body.genreid).exec(callback);
      },
      genre_books: function (callback) {
        Book.find({ genre: req.body.genreid }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.genre_books.length > 0) {
        res.render('genre_delete', {
          title: 'Delete Genre',
          genre: results.genre,
          genre_books: results.genre_books,
        });
        return;
      } else {
        Genre.findByIdAndRemove(req.body.genreid, function deleteGenre(err) {
          if (err) {
            return next(err);
          }
          res.redirect('/catalog/genres');
        });
      }
    }
  );
};

// Display Genre update form on GET.
exports.genre_update_get = function (req, res, next) {
  Genre.findById(req.params.id).exec(function (err, genre) {
    if (err) {
      return next(err);
    }
    res.render('genre_form', {
      title: 'Update Genre',
      genre: genre,
    });
  });
};

// Handle Genre update on POST.
exports.genre_update_post = [
  body('name', 'Genre name required.').trim().isLength({ min: 1 }).escape(),

  (req, res, next) => {
    const errors = validationResult(req);

    const genre = new Genre({
      name: req.body.name,
      _id: req.params.id,
    });

    // If validation errors in data
    if (!errors.isEmpty()) {
      res.render('genre_form', {
        title: 'Update Genre',
        genre: genre,
        errors: errors.array(),
      });
      return;
    }

    // If data is valid
    else {
      Genre.findByIdAndUpdate(
        req.params.id,
        genre,
        {},
        function (err, thegenre) {
          if (err) {
            return next(err);
          }
          res.redirect(thegenre.url);
        }
      );
    }
  },
];
