// import { addNewList } from 'middleware/email';
import React from 'react';
import { Modal, Spinner } from 'react-bootstrap';
// import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { ALPHANUMERICREG } from 'constants/validatorRegex';

const TemplateName = ({ open, handleModal, handleSubmit, listName, setListName, templateLoading }) => {

    return (
        <Modal
            show={ open }
            onHide={ handleModal }
            className="image-upload-modal contact-modal-width new-modal embed-link-modal"
            // backdrop={ email?.loading ? 'static' : true }
        >
            <Modal.Header closeButton>
                <div className="new-modal-header">
                    <Modal.Title>Add Template Name</Modal.Title>
                </div>
            </Modal.Header>
            <Modal.Body className="content-generator-wrapper">
                <div className="add-user-form-container">
                    <div className="w-100 add-form-content d-flex flex-column justify-content-center align-items-start">
                        <div className="form-fields w-100">
                            <div
                                className="d-flex align-items-start flex-column w-100"
                                style={ { gap: '8px' } }
                            >
                                <div className="field-label">List name</div>
                                <input
                                    className="field-input"
                                    value={ listName }
                                    name="listName"
                                    placeholder="Enter list name"
                                    onChange={ (e) => setListName(e.target.value) }
                                    onKeyDown={ (e)=>{
                                        if (!ALPHANUMERICREG.test(e.key) && e.key !== 'Backspace') {
                                            e.preventDefault();
                                        }
                                    } }
                                />
                                {/* {errors.listName && (
                                    <span style={ { fontSize: '14px', color: 'red' } }>
                                        {errors.listName}
                                    </span>
                                )} */}
                            </div>

                        </div>
                    </div>
                    <button onClick={ handleSubmit } className="confirm-btn">
                        {templateLoading ? (
                            <Spinner animation="border" size={ 'sm' } role="status" />
                        ) : (
                            'Confirm'
                        )}
                    </button>
                </div>
            </Modal.Body>
        </Modal>
    );
};

TemplateName.propTypes = {
    open: PropTypes.bool,
    handleModal: PropTypes.func,
    handleSubmit: PropTypes.func,
    listName: PropTypes.string,
    setListName: PropTypes.func,
    templateLoading: PropTypes.bool
};

export default TemplateName;
