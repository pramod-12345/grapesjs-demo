import 'grapesjs/dist/css/grapes.min.css';
import './index.sass';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import grapesjs from 'grapesjs';
import gjsBlockBasic from 'grapesjs-blocks-basic';
import grapesjsStyleBg from 'grapesjs-style-bg';
import gjsTailwind from 'grapesjs-tailwind';
import gjsForms from 'grapesjs-plugin-forms';
import 'grapesjs/dist/css/grapes.min.css';
import 'grapick/dist/grapick.min.css';
// import plugin from 'grapesjs-rte-extensions';
// import 'grapesjs-rte-extensions/dist/grapesjs-rte-extensions.min.css';
import { ROUTES } from 'constants/appRoutes';
import { useDispatch, useSelector } from 'react-redux';
import gjsNavbar from 'grapesjs-navbar';
import { Button, Form, Spinner } from 'react-bootstrap';
import ButtonLoader from 'components/core/loader/button-loader';
import {
    changeTitleToSlug,
    dataURLtoFile,
    getDomain,
    getGjsSlug,
    getSite,
    mixpanelCommonData,
    trimStringLength,
} from 'utils/helpers';
import { asyncValidatePageSlug } from 'utils/asyncValidate';
import gjsTailwindDark from '../../dist/grapesjs-tailwind-dark.min.js';
import { getUnsplash, imageUpload } from 'middleware/assessments';
import {
    change as reduxChange,
    reduxForm,
    reset,
    stopAsyncValidation,
} from 'redux-form';
import { Field, change } from 'redux-form';
import UploadImageModal from 'components/assessment/shared/UploadImageModal';
import { getPageById, grapesjsPublish } from 'middleware/page';
import { useHistory } from 'react-router-dom';
import { PAGE_STATUS } from 'constants/app';
import { useContext } from 'react';
import { MixpanelContext } from 'utils/tracking';
import gjsExport from 'grapesjs-plugin-export';
import gjsNewLetter from 'grapesjs-preset-webpage';
import TemplateName from './templateNameModal';
import { builderPageValidate as validate } from 'utils/validates';
import commands from './commands';
import { getTemplateList, saveTemplate } from 'middleware/grapes';
import html2canvas from 'html2canvas';
import PropTypes from 'prop-types';
import _ from 'lodash';
import SEOSection from './seo-section';
import { renderFieldWG } from 'utils/formUtils';

const previewImage = null;

let builder = null;
const GrapesJsEditor = (props) => {
    const dispatch = useDispatch();
    const history = useHistory();
    const site = getSite();
    const { initialize } = props;
    // const pageForm = useSelector((state)=>state.form.pageForm)
    const gjsForm = useSelector((state) => state.form.gjsForm);
    const page = useSelector((state) => state.page.page);
    const statusLoading = useSelector((state) => state.page.status);
    // const [ checkSlug, setCheckSlug ] = useState(page?.slug ?? '');
    // const [ isSlugMatch, setIsSlugMatch ] = useState(false);
    const [ isSlugLoading, setIsSlugLoading ] = useState(false);
    const [ templateLoading, setTemplateLoading ] = useState(false);
    const [ publishLoading, setPublishLoading ] = useState(false);
    const [ openImageModal, setOpenImage ] = useState(null);
    const mixpanel = useContext(MixpanelContext);
    const queryParams = props.location.search;
    const id = getGjsSlug(history.location?.pathname);
    const [ isEditUrl, setEditUrl ] = useState(id ? false : true);
    const [ open, setOpen ] = useState(false);
    const [ listName, setListName ] = useState('');
    const [ tempData, setTempData ] = useState('');
    const [ templateList, setTemplateList ] = useState([]);
    const [ seoErrorMessage, setSeoErrorMessage ] = useState({});
    const [ asyncLoad, setAsyncLoad ] = useState(false);
    const [ availablePage, setAvailablePage ] = useState(false);
    const [ isUploadImageLoading, setIsUploadImageLoading ] = useState(false);
    const slugRef = useRef();

    const getBase64 = (base64) => {
        dispatch(reduxChange('gjsForm', 'gjsUrl', base64));
    };

    const handleEvent = (eventName, data) => {
        mixpanel.track(eventName, mixpanelCommonData(data));
    };

    const handleSearch = (event) => {
        const query = event.target.value;
        dispatch(getUnsplash('/photos', query));
    };

    const clearImage = () => {
        dispatch(reduxChange('gjsForm', 'gjsForm', ''));
    };

    const unsplashImages = useSelector(
        (state) => state.assessment.unsplashImages
    );
    const toggleImageModal = async (_, img) => {
        setIsUploadImageLoading(true);
        const selected = builder?.getSelected();
        if (selected && selected.is('image') && img) {
            const file = dataURLtoFile(img, 'gjsImg');
            const url = await imageUpload(getDomain(), 'grapes-template-image', file);
            selected.set({ src: url });
        }
        openImageModal?.assets.remove;
        setIsUploadImageLoading(false);
        openImageModal?.close();
    };

    const asyncSlugValidate = (value) => {
        setIsSlugLoading(true);
        asyncValidatePageSlug(site, value).then((result) => {
            if (result?.status) {
                setEditUrl(false);
                // console.log('success', result?.status);
                // setIsSlugMatch(result?.status);
                setIsSlugLoading(false);
                setAvailablePage(true);
            } else {
                setEditUrl(true);
                // console.log('fail');
                // setIsSlugMatch(result?.status)
                dispatch(stopAsyncValidation('gjsForm', { gjsSlug: result?.message }));
                setIsSlugLoading(false);
                setAvailablePage(false);
            }
        });
        setAsyncLoad(false);
    };

    // const debounceFn = useCallback(_.debounce(asyncSlugValidate, 400), []);

    const escapeName = (name) =>
        `${ name }`.trim().replace(/([^a-z0-9\w-:/]+)/gi, '-');

    const handleModal = () => {
        setOpen(!open);
    };

    useEffect(() => {
        if (id) {
            dispatch(getPageById(id, site?.id, queryParams));
        }
        !id && asyncSlugValidate(page?.home ? page?.slugHome : page?.slug);
    }, [ id, templateList ]);

    useEffect(() => {
        if (page?.content && builder && id) {
            builder?.setComponents(page?.content);
            // setCheckSlug(page?.slug)
        } else {
            // setCheckSlug('');
        }
    }, [ page, templateList ]);

    const appendCustonBlocks = (template) => {
    // console.log('templateList',template)
        const blocks =
      template &&
      template?.map((item, index) => {
          return {
              id: index,
              label: item?.name,
              category: 'Templates',
              tab: 'Templates', // Specify the tab name
              attributes: { class: 'gjs-fonts gjs-f-b1' },
              content: item?.content,
              media: `<img src=${ item.imageUrl } />`,
          };
      });
        console.log(blocks);
        const container = document.getElementById('custom-templates');
        if (container) {
            container.innerHTML = null;
            const newBlocksEl = builder.BlockManager.render(blocks, {
                external: true,
            });
            container.appendChild(newBlocksEl);
        }
    };

    const handleSubmit = async () => {
        setTemplateLoading(true);
        const grapesJsElement = document.querySelector('.gjs-frame');
        const iframeDoc = grapesJsElement.contentWindow.document; // Access iframe document
        const element = iframeDoc.getElementById(builder?.getWrapper()?.ccid);
        const { offsetWidth } = element;
        const canvas = await html2canvas(element, {
            width: offsetWidth,
            height: 500,
        });
        const img = canvas.toDataURL('image/png');
        const file = dataURLtoFile(img, listName);
        const url = await imageUpload(getDomain(), 'grapes-template-image', file);

        appendCustonBlocks([
            ...templateList,
            { label: listName, content: tempData, img: url },
        ]);
        const formData = new FormData();
        formData.append('name', listName);
        formData.append('content', tempData);
        formData.append('imageUrl', url);
        dispatch(saveTemplate(formData, setTemplateLoading));
        setOpen(false);
    };

    useEffect(() => {
        dispatch({
            type: 'SET_ACTIVE_SIDEBAR',
            payload: ROUTES.GRAPES,
        });

        if (builder && !id) {
            builder?.setComponents(null);
            builder = null;
        }

        builder = grapesjs.init({
            canvas: {
                styles: [
                    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css',
                    'https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Noto+Sans+Arabic:wght@100;300;400&family=Noto+Sans+Buhid&family=Qwitcher+Grypen&display=swap',
                    'https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css',
                    'https://unpkg.com/grapesjs/dist/css/grapes.min.css',
                    'https://unpkg.com/grapick/dist/grapick.min.css',
                ],
                scripts: [
                    'https://code.jquery.com/jquery-3.3.1.slim.min.js',
                    'https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js',
                    'https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js',
                    'https://unpkg.com/grapesjs-style-bg',
                    'https://unpkg.com/grapesjs-tailwind',
                    'https://cdn.tailwindcss.com',
                ],
            },
            height: '100%',
            width: 'auto',
            clearStyles: 'container',
            container: '#gjs',
            blockManager: {},
            assetManager: {
                custom: {
                    open(assetProps) {
                        console.log(assetProps);
                        setOpenImage(assetProps);
                    },
                    close(assetProps) {
                        console.log(assetProps);
                        setOpenImage(null);
                    },
                },
            },
            showOffsets: true,
            fromElement: true,

            noticeOnUnload: false,
            pageManager: true,
            storageManager: {
                type: 'session',
                options: {
                    session: { key: 'myPages' },
                },
            },
            selectorManager: { escapeName },
            plugins: [
                gjsBlockBasic,
                grapesjsStyleBg,
                gjsForms,
                gjsNavbar,
                gjsTailwindDark,
                gjsTailwind,
                gjsExport,
                gjsNewLetter,
            ],
            pluginsOpts: {
                gjsBlockBasic: {},
                gjsTailwind: {},
                grapesjsStyleBg: {},
                gjsTailwindDark: {},
                [ gjsNewLetter ]: {
                    /* options */
                },
                [ gjsExport ]: {
                    /* options */
                },
                // plugin:{
                //     base: {
                //         bold: true,
                //         italic: true,
                //         underline: true,
                //         strikethrough: true,
                //         link: true,
                //     },
                //     fonts: {
                //         fontColor: true,
                //         hilite: true,
                //     },
                //     format: {
                //         heading1: true,
                //         heading2: true,
                //         heading3: true,
                //         paragraph: true,
                //         clearFormatting: true,
                //     },
                //     subscriptSuperscript: false,//|true
                //     indentOutdent: false,//|true
                //     list: false,//|true
                //     align: true,//|true
                //     actions: false,//|true
                //     undoredo: false,//|true
                //     extra: false,//|true
                //     darkColorPicker: true,//|false
                //     maxWidth: '600px'

                // },
                gjsForms: {},
                gjsNavbar: {},
            },
        });
        const options = {
            ...{
                onScreenshotAsync(shot) {
                    return shot;
                },
            },
        };
        const visibilityButton = builder.Panels.getButton(
            'options',
            'sw-visibility'
        );
        visibilityButton.set('active', false);

        builder.Panels.addButton('options', {
            id: 'update-theme',
            className: 'fa fa-adjust',
            command: 'open-update-theme',
            attributes: {
                title: 'Update Theme',
                'data-tooltip-pos': 'bottom',
            },
        });

        const myPanel = {
            id: 'myPanel', // Unique ID for the panel
            el: '.my-panel-container', // Selector for the panel container
            buttons: [
                {
                    id: 'button-1',
                    className: 'fa fa-plus',
                    label: 'My Button',
                    command: 'my-custom-command', // Command to be executed on button click
                    attributes: {
                        'data-tooltip': 'My Custom Tooltip',
                    },
                },
            ],
        };

        builder.Panels.addPanel(myPanel);

        builder.Panels.addButton('options', {
            id: 'open-templates',
            className: 'fa fa-floppy-o',
            attributes: {
                title: 'Save templates',
            },
            command: 'save-template',
        });

        builder.Panels.addButton('options', {
            id: 'undo',
            className: 'fa fa-undo',
            command: 'core:undo',
            attributes: { title: 'Undo' },
        });
        builder.Panels.addButton('options', {
            id: 'redo',
            className: 'fa fa-repeat',
            command: 'core:redo',
            attributes: { title: 'Redo' },
        });

        builder.DomComponents.addType('link', {
            model: {
                defaults: {
                    traits: [
                        {
                            type: 'href-next',
                            name: 'href',
                            label: 'New href',
                        },
                    ],
                },
            },
        });

        builder.BlockManager.get('link').set({
            traits: [
                'id',
                'title',
                'href',
                'target',
                {
                    type: 'checkbox',
                    name: 'data-bmptrack',
                    label: 'Link Tracking',
                },
            ],
        });

        const button = builder.Panels.getButton('views', 'open-blocks');

        button.listenTo(button, 'change', (model) => {
            if (model.attributes.active) {
                const category = builder.BlockManager.getCategories();
                category.each((ctg) => ctg.set('open', false));
            }
        });

        const pn = builder.Panels;
        let editPanel = null;
        pn.addButton('views', {
            id: 'editMenu',
            attributes: { class: 'fa fa-file', title: 'Templates' },
            active: false,
            command: {
                run: function () {
                    if (editPanel == null) {
                        const editMenuDiv = document.createElement('div');
                        editMenuDiv.id = 'custom-templates';
                        const panels = pn.getPanel('views-container');
                        panels
                            .set('appendContent', editMenuDiv)
                            .trigger('change:appendContent');
                        editPanel = editMenuDiv;
                    }
                    editPanel.style.display = 'block';
                    appendCustonBlocks(templateList);
                },
                stop: function () {
                    if (editPanel != null) {
                        editPanel.style.display = 'none';
                    }
                },
            },
        });

        commands(builder, options);
        builder.Commands.add('save-template', {
            run: function (editor, sender) {
                sender && sender.set('active'); // turn off the button
                const htmlData = editor.getHtml();
                const cssData = editor.getCss();
                const templateData = `
                ${ htmlData }
                <style>${ cssData }</style>
                `;
                setTempData(templateData);
                handleModal();
            },
        });

        // return () => {
        //     builder.setComponents('<div class="cls"></div><style>...</style>');

    // }
    }, [ templateList ]);

    console.log('gjsForm?.values', gjsForm);

    const handleGetHtml = (formData, status) => {
        const obj = { ...seoErrorMessage };
        const htmlData = builder.getHtml();
        const cssData = builder.getCss();

        const htmlResponse = `
        ${ htmlData }
        <style>${ cssData }</style>
        `;
        if (!htmlData || htmlData === '<p></p>') {
            setErrorMessageContent(true);
            return;
        }
        if (!formData?.seoDescription) {
            obj[ 'description' ] = true;
            setSeoErrorMessage(obj);
        }
        if (!formData?.seoTitle) {
            obj[ 'title' ] = true;
            setSeoErrorMessage(obj);
        }

        const request = {
            siteId: site?.id,
            title: formData.title,
            content: htmlResponse,
            imageUrl: null,
            slug: formData.gjsSlug,
            seoTitle: formData.seoTitle,
            seoDescription: formData.seoDescription,
            status: status,
            imageAltText: null,
            defaultTemplate: false,
        };

        dispatch(
            grapesjsPublish(
                site?.domain,
                request,
                page?.id,
                id,
                handleEvent,
                setPublishLoading
            )
        );
    };

    const setList = (d) => {
        console.log('d', d);
        setTemplateList(d);
    };

    useEffect(() => {
        const query = 'photo';
        dispatch(getUnsplash('/photos', query));
        dispatch(getTemplateList(setList));
    }, []);

    useEffect(() => {
        return () => {
            builder?.setComponents(null);
            builder?.render();
            // setCheckSlug(null);
            dispatch(reset('gjsForm'));
            dispatch(reset('pageForm'));
            dispatch({
                type: 'CLEAR_PAGE_FORM',
            });
        };
    }, []);

    useEffect(() => {
        if (page && ((page.home && page.slugHome) || (!page.home && page.slug))) {
            // page[ 'pageUrl' ] = page.imageUrl;
            // page[ 'data' ] = (page.content);
            // delete page.imageUrl;
            initialize({ ...page, gjsSlug: page?.slug });
            !id && asyncSlugValidate(page?.home ? page?.slugHome : page?.slug);
        }
    }, [ page ]);

    useEffect(() => {
        if (gjsForm?.values?.seoDescription === undefined) {
            dispatch(
                change('gjsForm', 'seoDescription', gjsForm?.values?.seoDescription)
            );
        }
    }, [ gjsForm?.values?.seoDescription ]);

    const handleChange = (value, blogData) => {
        const dd = id ? blogData?.gjsSlug !== value : true;
        if (value && dd) {
            setAsyncLoad(true);
            asyncSlugValidate(value);
        } else if (!value) {
            dispatch(stopAsyncValidation('gjsForm', { gjsSlug: 'Required' }));
        }
    };
    const handleTitleChange = (value) => {
        dispatch(reduxChange('gjsForm', 'seoTitle', trimStringLength(value, 70)));
        dispatch(
            reduxChange('gjsForm', 'seoDescription', trimStringLength(value, 230))
        );
        if (!id) {
            dispatch(
                reduxChange(
                    'gjsForm',
                    'gjsSlug',
                    changeTitleToSlug(trimStringLength(value, 70))
                )
            );
        }
        if (value) {
            asyncSlugValidate(changeTitleToSlug(value));
        }
    };

    const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1);

    const asyncValidateFunc = _.debounce(handleChange, 800);
    const asyncChangeCallback = useCallback(asyncValidateFunc, []);

    const asyncValidateTitle = _.debounce(handleTitleChange, 800);
    const asyncChangeTitleCallback = useCallback(asyncValidateTitle, []);

    const saveData = () => {
        if (gjsForm?.values?.gjsSlug) {
            setEditUrl(!availablePage);
            slugRef.current?.focus();
            const validSlug = id ? page.slug !== gjsForm?.values?.gjsSlug : true;
            !validSlug && setEditUrl(false);
            !availablePage &&
        validSlug &&
        dispatch(
            stopAsyncValidation('gjsForm', {
                gjsSlug: 'Page post URL not available. Try another.',
            })
        );
        } else {
            setEditUrl(true);
            dispatch(stopAsyncValidation('gjsForm', { gjsSlug: 'Required' }));
        }
    };

    console.log('templateListtemplateListtemplateList', templateList);

    return (
        <main className="dashboard-data createNewBlog createNewPage">
            <section data-tut="reactour__iso" className="dashboard-body">

                <Form className="search-form d-flex align-items-center">
                    <Form.Group controlId="formBasicEmail">
                        <div className="d-flex gap-3 align-items-center">
                            <div className="d-flex w-75 flex-column">
                                <Field
                                    id="title-gjs"
                                    name="title"
                                    component={ renderFieldWG }
                                    placeholder={ 'Enter title' }
                                    normalize={ capitalize }
                                    handleChange={ asyncChangeTitleCallback }
                                    // onFocus={ () => {setIdeasVisble(true); setInputFocus(true)} }
                                    // onBlur={ ()=>setInputFocus(false) }
                                />
                                {/* {!isSlugMatch && checkSlug !=='' && !page?.slug && checkSlug.length > 1 && <span style={ { color: 'red', fontWeight: '500', fontSize: 14 } }>Please enter a valid title</span>} */}
                                {/* {!isEditUrl && <span style={ { color: 'red', fontWeight: '500', fontSize: 14 } }>Please enter a valid title</span>} */}
                            </div>
                            {isSlugLoading && (
                                <Spinner
                                    className="ml-3"
                                    variant="primary"
                                    animation="border"
                                    size={ 'sm' }
                                    role="status"
                                />
                            )}
                        </div>
                    </Form.Group>
                    <div className="d-flex justify-content-end align-items-center mb-4">
                        {/* <ButtonLoader
                            button={  <Button disabled={ !isSlugMatch && isEditUrl } type='button' onClick={ ()=> handleGetHtml(gjsForm?.values,PAGE_STATUS.PUBLISHED) } variant="primary">Publish</Button> }
                            loadingText={ 'Publish' }
                            loading={ publishLoading }
                            className=""
                        /> */}
                        <ButtonLoader
                            button={
                                <Button
                                    disabled={ isEditUrl }
                                    type="button"
                                    onClick={ () =>
                                        !isEditUrl &&
                        handleGetHtml(gjsForm?.values, PAGE_STATUS.PUBLISHED)
                                    }
                                    variant="primary"
                                >
                                    Publish
                                </Button>
                            }
                            loadingText={ 'Publish' }
                            visible={ statusLoading === PAGE_STATUS.PUBLISHED }
                            loading={ publishLoading }
                            className="d-flex"
                        />
                    </div>
                </Form>
                <div id="gjs" className="h grapes-main-container"></div>
                <UploadImageModal
                    formName={ 'gjsForm' }
                    fieldName={ 'gjsUrl' }
                    getBase64={ getBase64 }
                    handleSearch={ handleSearch }
                    clearImage={ clearImage }
                    previewFile={ previewImage }
                    unsplashImages={ unsplashImages }
                    openModal={ !!openImageModal }
                    handleToggleModal={ toggleImageModal }
                    isUploadImageLoading={ isUploadImageLoading }
                    isAlt={ true }
                    fieldAltName="imageAltText"
                />
                {page?.content && (
                    <Spinner
                        className="mt-5 d-block text-center position-absolute"
                        style={ { left: '50%', top: '50%' } }
                        variant="primary"
                        animation="border"
                        size={ 'lg' }
                        role="status"
                    />
                )}
                <TemplateName
                    handleModal={ handleModal }
                    open={ open }
                    handleSubmit={ handleSubmit }
                    listName={ listName }
                    setListName={ setListName }
                    templateLoading={ templateLoading }
                />
                <div className="dashboard-bottom-section">
                    <div className="seo">
                        <SEOSection
                            slugRef={ slugRef }
                            id={ id }
                            isEditUrl={ isEditUrl }
                            page={ page }
                            saveData={ saveData }
                            asyncLoad={ asyncLoad }
                            asyncChangeCallback={ asyncChangeCallback }
                            setSeoErrorMessage={ setSeoErrorMessage }
                            site={ site }
                            seoErrorMessage={ seoErrorMessage }
                            pageForm={ gjsForm }
                        />
                    </div>
                </div>

            </section>

            {/* {isUploadImageLoading &&
                <div style={ { top:0, zIndex: 100000, position: 'absolute',width: '100%', height: '100vh', backgroundColor:'rgba(0, 0, 0, .4)' } }
                    className="d-flex align-items-center justify-content-center loader-container">
                    <Spinner
                        variant="primary"
                        animation="border"
                        size={ 'md' }
                        role="status"
                    />
                </div>
                } */}
        </main>
    );
};

export default reduxForm({
    form: 'gjsForm',
    validate,
    asyncValidatePageSlug,
    asyncChangeFields: [ 'gjsSlug' ],
})(GrapesJsEditor);

TemplateName.propTypes = {
    location: PropTypes.string,
};
