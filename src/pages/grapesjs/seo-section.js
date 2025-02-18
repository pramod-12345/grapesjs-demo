import React,{ useState } from 'react'
import { Field, stopAsyncValidation } from 'redux-form';
import { renderFieldWG,renderFieldChangeWG, renderTextArea } from 'utils/formUtils'
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux'
import {
    //SEOUrlIcon,
    EditSeoIcon
} from 'utils/svg';

const TitleView = (props) => {
    const { edit, formData, setSeoErrorMessage, seoErrorMessage } = props
    const handleChange = (value) => {
        seoErrorMessage[ 'title' ] =  !value
        setSeoErrorMessage({ ...seoErrorMessage })
    }
    const capitalize = value => value.charAt(0).toUpperCase() + value.slice(1)
    if(!edit){
        return <h4 className="seoTitle">{ formData?.seoTitle || 'Page SEO title' }</h4>
    }else{
        return (
            <div className="seo-form-label seo-form-label-error">
                <label>Heading</label>
                <Field
                    name="seoTitle"
                    handleChange={ handleChange }
                    maxLength={ 70 }
                    component={ renderFieldWG }
                    placeholder={ 'Page SEO title' }
                    normalize={ capitalize }
                />
            </div>
        )
    }
}

const DescriptionView  = (props) => {
    const { edit,formData, seoDescription ,setSeoErrorMessage, seoErrorMessage } = props
    const capitalize = value => value.charAt(0).toUpperCase() + value.slice(1)
    const handleChange = (value) => {
        seoErrorMessage[ 'description' ] =  !value
        setSeoErrorMessage({ ...seoErrorMessage })
    }
    const showDiscription = () => {
        const value = (formData?.seoDescription || seoDescription)
        return value?.length > 230 ? value?.substring(0, Math.min(value?.length, 230))+'...' : value
    }
    if(!edit){
        return <div className="seoContent">{  showDiscription() || 'Page SEO description' }</div>
    }else{
        return (
            <div className="seo-form-label seo-form-label-description">
                <label>Description</label>
                <Field
                    name="seoDescription"
                    component={ renderTextArea }
                    maxLength={ 230 }
                    handleChange={ handleChange }
                    placeholder={ 'Page SEO Description' }
                    normalize={ capitalize }
                />
            </div>
        )
    }
}
const SEOSection = (props) => {
    const { pageForm, site, seoErrorMessage ,setSeoErrorMessage,slugRef,page,setEditUrl, asyncChangeCallback, asyncLoad, saveData  } = props
    const [ edit, setEdit ] = useState(false)
    const dispatch = useDispatch()
    const handleClick = (type) => {
        const obj1 = { ...seoErrorMessage }
        obj1[ type ] = false
        setEdit(!edit)
        setSeoErrorMessage(obj1)
    }

    const handleUpdate = ( ) => {
        !pageForm.values?.gjsSlug && dispatch(stopAsyncValidation('gjsForm', { gjsSlug: 'Required' }))
        if(!asyncLoad && !pageForm.syncErrors.gjsSlug && !pageForm?.asyncErrors?.gjsSlug && pageForm.values.gjsSlug){
            saveData()
            setEditUrl && setEditUrl(false)
            setEdit(!edit)
        }
    }
    const isSeoValid = () => {
        return pageForm?.values?.seoTitle && pageForm.values.seoDescription && pageForm?.values?.gjsSlug
    }

    console.log('pageForm', pageForm);
    return( <div className="seoSection">
        <h3 className="seoHeading">SEO</h3>
        <div className="seoDataPreview">
            <TitleView seoErrorMessage={ seoErrorMessage } setSeoErrorMessage={ setSeoErrorMessage } formData={ pageForm?.values }  edit={ edit }  handleUpdate={ handleUpdate } />
            {edit && <span className='field_error'>{ seoErrorMessage?.title && 'Please insert title'} </span>}
            {!edit ? <p className="seoURL"><span className="seoUrl">https://{site?.customDomain || site?.domain}/pagebuilder/{ pageForm?.values?.gjsSlug}</span> </p> : <div className="seo-form-label seo-form-label-error">
                <label>
                    Link
                </label>
                <div className={ 'page-slug' }>
                    <span className="page-slug-link">https://{site?.customDomain || site?.domain}/</span>
                    <Field
                        refData={ slugRef }
                        name="gjsSlug"
                        label=""
                        type="text"
                        handleChange={ (value) => asyncChangeCallback(value,page) }
                        component={ renderFieldChangeWG }
                        changeType={ 'gjsSlug' }
                        maxLength="150"
                        isSlug={ true }
                        withoutTouch={ true }
                        placeholder=''
                    />
                    {
                        asyncLoad && <div className="small-up-loader">
                            <div className="lds-facebook"><div></div><div></div><div></div></div>
                        </div>
                    }
                </div>
            </div> }
            <DescriptionView seoErrorMessage={ seoErrorMessage }  setSeoErrorMessage={ setSeoErrorMessage } formData={ pageForm?.values }  edit={ edit } handleUpdate={ handleUpdate }  />
            {edit && <span className='field_error'>{ seoErrorMessage?.title && 'Please insert description'}</span>}
            {(seoErrorMessage?.title || seoErrorMessage?.description || pageForm?.asyncErrors?.gjsSlug) && !edit  && <div className='error-heading'>
                <span className='field_error'>{ seoErrorMessage?.title && 'Please insert title' || seoErrorMessage?.description && 'Please insert description'}</span><br/>
                <span className='field_error'>{ pageForm?.asyncErrors?.gjsSlug }</span>
            </div>}
            {edit ? <button className='btn btn-primary' disabled={ asyncLoad || pageForm?.asyncErrors?.gjsSlug || !isSeoValid() } onClick={ () => handleUpdate() }> update </button> : <a className="edit-btn btn btn-primary" href='javascript:void(0)' onClick={ handleClick }><EditSeoIcon />Edit</a>}
            {edit && <button
                className="btn btn-primary ml-2"
                onClick={ () => setEdit(false) }
            >
                Cancel
            </button>}
        </div>
    </div>)
}

TitleView.propTypes = {
    handleClick: PropTypes.func,
    edit: PropTypes.object,
    handleUpdate: PropTypes.func,
    formData: PropTypes.object,
    seoDescription: PropTypes.string,
    setSeoErrorMessage: PropTypes.func,
    seoErrorMessage: PropTypes.object,
};

SEOSection.propTypes = {
    pageForm: PropTypes.object,
    site: PropTypes.object,
    seoErrorMessage: PropTypes.object,
    setSeoErrorMessage: PropTypes.func,
    slugRef: PropTypes.any,
    page: PropTypes.any,
    setEditUrl: PropTypes.any,
    id: PropTypes.string,
    asyncChangeCallback: PropTypes.func,
    asyncLoad: PropTypes.bool,
    saveData: PropTypes.func
};

DescriptionView.propTypes = {
    edit: PropTypes.object,
    formData: PropTypes.object,
    seoDescription: PropTypes.string,
    setSeoErrorMessage: PropTypes.func,
    seoErrorMessage: PropTypes.object,
};
export default SEOSection