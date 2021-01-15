const BookInstance = require('../models/bookinstance');
const Book = require('../models/book');

const async = require('async');
const { body, validationResult } = require('express-validator');

// Display list of all BookInstances.
exports.bookinstance_list = function (req, res, next) {
  BookInstance.find()
    .populate('book')
    .exec(function (err, list_bookinstances) {
      if (err) {
        return next(err);
      }
      res.render('bookinstance_list', {
        title: 'Book Instance List',
        bookinstance_list: list_bookinstances,
      });
    });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function (req, res, next) {
  BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function (err, bookinstance) {
      if (err) {
        return next(err);
      }
      if (bookinstance === null) {
        const err = new Error('Book Instance not found.');
        err.status = 404;
        return next(err);
      }
      res.render('bookinstance_detail', {
        title: `Copy: ${bookinstance.book.title}`,
        bookinstance: bookinstance,
      });
    });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function (req, res, next) {
  // GET BOOK LIST
  Book.find({}, 'title')
    .sort({ title: 1 })
    .exec(function (err, book_list) {
      if (err) {
        return next(err);
      }
      res.render('bookinstance_form', {
        title: 'Create BookInstance',
        book_list: book_list,
      });
    });
  // RENDER BOOKINSTANCE_FORM AND PASS TITLE AND BOOK LIST
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
  body('imprint', 'Imprint must be specified')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('status').escape(),
  body('due_back', 'Invalid date')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  (req, res, next) => {
    const errors = validationResult(req);
    // TEST WITH DESTRUCTURING
    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });
    // IF VALIDATION ERROR
    if (!errors.isEmpty()) {
      Book.find({}, 'title')
        .sort({ title: 1 })
        .exec(function (err, book_list) {
          if (err) {
            return next(err);
          }
          res.render('bookinstance_form', {
            title: 'Create BookInstance',
            book_list: book_list,
            selected_book: bookinstance.book._id,
            bookinstance: bookinstance,
            errors: errors.array(),
          });
        });
      return;
    }
    // IF DATA IS GOOD
    else {
      bookinstance.save(function (err) {
        if (err) {
          return next(err);
        }
        res.redirect(bookinstance.url);
      });
    }
  },
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function (req, res, next) {
  BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function (err, bookinstance) {
      if (err) {
        return next(err);
      }
      res.render('bookinstance_delete', {
        title: 'Delete Bookinstance',
        bookinstance: bookinstance,
      });
    });
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function (req, res, next) {
  // NO NEED FOR VALIDATION
  // MAKE SURE BOOKINSTANCE EXISTS
  BookInstance.findByIdAndRemove(
    req.body.bookinstanceid,
    function deleteBookinstance(err) {
      if (err) {
        return next(err);
      }
      res.redirect('/catalog/bookinstances');
    }
  );
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function (req, res, next) {
  async.parallel(
    {
      bookinstance: function (callback) {
        BookInstance.findById(req.params.id).populate('book').exec(callback);
      },
      book_list: function (callback) {
        Book.find().sort({ title: 1 }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.bookinstance === null) {
        const err = new Error('Book not found');
        err.status = 404;
        return next(err);
      }
      res.render('bookinstance_form', {
        title: 'Update Bookinstance',
        bookinstance: results.bookinstance,
        book_list: results.book_list,
        selected_book: results.bookinstance.book.title,
      });
    }
  );
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = function (req, res, next) {
  res.send('NOT IMPLEMENTED: BookInstance update POST');
};
