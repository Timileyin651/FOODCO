const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;

    if (res.headersSent) return next(err);

    if (statusCode >= 500) console.log(err);

    // The JSON API routes keep their old response shape; the EJS front end
    // gets the shared error page.
    const wantsHtml = (req.get('accept') || '').includes('text/html');

    if (wantsHtml) {
        const message = err.isOperational
            ? err.message
            : 'Something went wrong. Please try again.';
        return res.status(statusCode).render('error', {
            status: statusCode,
            message
        });
    }

    console.log(err);

    return res.status(statusCode).json({
        status: 'error',
        message: err.isOperational ? err.message : 'Something went wrong'
    });
};

module.exports = errorHandler;
