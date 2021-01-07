var Author = require('../models/author');
var Book = require('../models/book');
var BookInstance = require('../models/bookinstance');
var Genre = require('../models/genre');

var async = require('async');
const { body, validationResult } = require('express-validator');

exports.index = function (req, res, next) {
  async.parallel(
    {
      book_count: function (callback) {
        Book.countDocuments({}, callback); // Pass an empty object as match condition to find all documents of this collection
      },
      book_instance_count: function (callback) {
        BookInstance.countDocuments({}, callback);
      },
      book_instance_available_count: function (callback) {
        BookInstance.countDocuments({ status: 'Available' }, callback);
      },
      author_count: function (callback) {
        Author.countDocuments({}, callback);
      },
      genre_count: function (callback) {
        Genre.countDocuments({}, callback);
      },
    },
    function (err, results) {
      res.render('index', {
        title: 'Local Library Home',
        error: err,
        data: results,
      });
    }
  );
};

// Display list of all books.
exports.book_list = function (req, res, next) {
  Book.find({}, 'title author')
    .sort([['title', 'ascending']])
    .populate('author')
    .exec(function (err, data) {
      if (err) {
        return next(err);
      }
      res.render('book_list', { title: 'Book List', book_list: data });
    });
};

// Display detail page for a specific book.
exports.book_detail = function (req, res, next) {
  // PATH DETAILS: /book/:id
  // WILL NEED TO POPULATE FOR AUTHOR AND GENRE
  // NEED BOTH BOOK AND BOOK_INSTANCE
  async.parallel(
    {
      book: function (callback) {
        Book.findById(req.params.id)
          .populate('author')
          .populate('genre')
          .exec(callback);
      },
      book_instance: function (callback) {
        BookInstance.find({ book: req.params.id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.book === null) {
        const err = new Error('Book not found');
        err.status = 404;
        return next(err);
      }
      res.render('book_detail', {
        title: 'Book Detail',
        book: results.book,
        book_instance: results.book_instance,
      });
    }
  );
};

// Display book create form on GET.
exports.book_create_get = function (req, res, next) {
  async.parallel(
    {
      authors: function (callback) {
        Author.find().sort({ family_name: 1 }).exec(callback);
      },
      genres: function (callback) {
        Genre.find().sort({ name: 1 }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      res.render('book_form', {
        title: 'Create Book',
        authors: results.authors,
        genres: results.genres,
      });
    }
  );
};

// Handle book create on POST.
exports.book_create_post = [
  // CONVERT GENRE TO ARRAY
  // REQUIRED BECAUSE A BOOK CAN HAVE MULTIPLE GENRES. WANT CONSISTENCY IN DATA TYPE WHEN STORED. GENRE IN THE BOOK MODEL IS AN ARRAY.
  (req, res, next) => {
    if (!(req.body.genre instanceof Array)) {
      // IF UNDEFINED STORE EMPTY ARRAY
      if (typeof req.body.genre === 'undefined') req.body.genre = [];
      // OTHERWISE CONVERT TO ARRAY CONTAINING VALUES OF REQ.BODY.GENRE
      else {
        req.body.genre = new Array(req.body.genre);
      }
    }
    // SEND TO NEXT MIDDLEWARE
    next();
  },

  // VALIDATE FORM DATA
  body('title', 'Title must not be empty.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('author', 'Author must not be empty.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('summary', 'Summary must not be empty.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('genre.*').escape(),

  // PROCESS REQUEST
  (req, res, next) => {
    const errors = validationResult(req);

    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre,
    });

    if (!errors.isEmpty()) {
      async.parallel(
        {
          authors: function (callback) {
            Author.find().sort({ family_name: 1 }).exec(callback);
          },
          genres: function (callback) {
            Genre.find().sort({ name: 1 }).exec(callback);
          },
        },
        function (err, results) {
          if (err) {
            return next(err);
          }
          for (let i = 0; i < results.genres.length; i++) {
            if (book.genre.indexOf(results.genres[i]._id) > -1) {
              results.genres[i].checked = 'true';
            }
          }
          res.render('book_form', {
            title: 'Create Book',
            authors: results.authors,
            genres: results.genres,
            book: book,
            errors: errors.array(),
          });
          return;
        }
      );
    } else {
      book.save(function (err) {
        if (err) {
          return next(err);
        }
        res.redirect(book.url);
      });
    }
  },
];

// Display book delete form on GET.
exports.book_delete_get = function (req, res, next) {
  async.parallel(
    {
      book: function (callback) {
        Book.findById(req.params.id).exec(callback);
      },
      bookinstances: function (callback) {
        BookInstance.find({ book: req.params.id }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      res.render('book_delete', {
        title: 'Delete Book',
        book: results.book,
        bookinstances: results.bookinstances,
      });
    }
  );
};

// Handle book delete on POST.
exports.book_delete_post = function (req, res, next) {
  res.send('NOT IMPLEMENTED: Book delete POST');
};

// Display book update form on GET.
exports.book_update_get = function (req, res, next) {
  res.send('NOT IMPLEMENTED: Book update GET');
};

// Handle book update on POST.
exports.book_update_post = function (req, res, next) {
  res.send('NOT IMPLEMENTED: Book update POST');
};
